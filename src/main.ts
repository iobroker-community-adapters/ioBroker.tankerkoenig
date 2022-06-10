/*
 * Created with @iobroker/create-adapter v2.0.1
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
import * as utils from '@iobroker/adapter-core';
import axios from 'axios';

// Load your modules here, e.g.:
import { statesObj, priceObj } from './lib/object_definition';
import { Result } from './lib/interface/resultInterface';

// timeouts
let requestTimeout: NodeJS.Timeout | null = null;
let refreshTimeout: NodeJS.Timeout | null = null;
let refreshStatusTimeout: NodeJS.Timeout | null = null;

// Global variables here
let refreshStatus = false;
const optionNoLog = false;
let sync_milliseconds = 5 * 60 * 1000; // 5min
const fuelTypes: string[] = ['e5', 'e10', 'diesel'];

class Tankerkoenig extends utils.Adapter {
	public constructor(options: Partial<utils.AdapterOptions> = {}) {
		super({
			...options,
			name: 'tankerkoenig',
		});
		this.on('ready', this.onReady.bind(this));
		this.on('stateChange', this.onStateChange.bind(this));
		//		this.on('objectChange', this.onObjectChange.bind(this));
		// this.on('message', this.onMessage.bind(this));
		this.on('unload', this.onUnload.bind(this));
	}

	/**
	 * Is called when databases are connected and adapter received configuration.
	 */
	private async onReady(): Promise<void> {
		// Initialize your adapter here

		const adapterObj: ioBroker.Object | null | undefined = await this.getForeignObjectAsync(
			`system.adapter.${this.namespace}`,
		);

		if (adapterObj) {
			if (adapterObj.common.mode !== 'daemon') {
				adapterObj.common.mode = 'daemon';
				await this.setForeignObjectAsync(adapterObj._id, adapterObj);
			} else {
				this.log.debug('Adapter is already running in daemon mode');
			}
		}

		// check if the sync time is a number, if not, the string is parsed to a number
		sync_milliseconds =
			typeof this.config.synctime === 'number'
				? this.config.synctime * 1000 * 60
				: parseInt(this.config.synctime, 10) * 1000 * 60;

		if (isNaN(sync_milliseconds) || sync_milliseconds < 5 * 60 * 1000) {
			sync_milliseconds = 300000; //5 * 60 * 1000 is set as the minimum interval
			this.log.warn(`Sync time was too short (${this.config.synctime}). New sync time is 5 min`);
		}
		this.log.info(`Sync time set to ${this.config.synctime} minutes or ${sync_milliseconds} ms`);

		// add to sync_milliseconds a random number between 0 and 1000 to avoid that all adapters start at the same time
		sync_milliseconds += Math.floor(Math.random() * 100);

		if (this.config.apikey.length === 36) {
			if (this.config.station.length > 0) {
				await this.createAllStates(this.config.station);
				await this.requestData();
			} else {
				this.writeLog(`No stations defined`, 'error');
			}
		} else {
			this.writeLog(`Es ist keine Api Key angegeben`, 'error');
		}
	}

	private async requestData(): Promise<any> {
		try {
			if (requestTimeout) clearTimeout(requestTimeout);
			this.writeLog(`request start now`, 'debug');
			const url = `https://creativecommons.tankerkoenig.de/json/prices.php?ids=${this.config.station
				.map((station) => station.station)
				.join(',')}&apikey=${this.config.apikey}`; // API key is included in the configuration Demo 00000000-0000-0000-0000-000000000002

			await axios
				.get(url, {
					headers: { 'User-Agent': `${this.name} ${this.version}` },
				})
				.then(async (response) => {
					if (response.status === 200) {
						this.writeLog(
							`type response: ${typeof response.data} >>> ${JSON.stringify(response.data)}`,
							'debug',
						);
						if (response.data.ok) {
							await this.setStateAsync('stations.json', {
								val: JSON.stringify(response.data),
								ack: true,
							});
							await this.writeState(response.data.prices);
							if (refreshStatusTimeout) clearTimeout(refreshStatusTimeout);
							refreshStatusTimeout = setTimeout(async () => {
								await this.setStateAsync(`stations.adapterStatus`, {
									val: 'idle',
									ack: true,
								});
							}, 2_000);
						}
					}
				})
				.catch(async (error) => {
					this.writeLog(
						'Read in fuel prices (targeted stations via ID) - Error: ' + error,
						'error',
					);
					await this.setStateAsync(`stations.adapterStatus`, {
						val: 'request Error',
						ack: true,
					});
				});
			await this.setStateAsync(`stations.lastUpdate`, { val: Date.now(), ack: true });
			this.writeLog(`last update: ${new Date().toString()}`, 'debug');

			// start the timer for the next request
			requestTimeout = setTimeout(async () => {
				this.writeLog(`request timeout start new request`, 'debug');
				await this.setStateAsync(`stations.adapterStatus`, {
					val: 'automatic request',
					ack: true,
				});
				await this.requestData();
			}, sync_milliseconds);
		} catch (error) {
			this.writeLog(`requestData error: ${error} stack: ${error.stack}`, 'error');
		}
	}

	private async writeState(prices: Result): Promise<void> {
		try {
			const station = this.config.station;
			const cheapest_e5: any[] = [];
			const cheapest_e10: any[] = [];
			const cheapest_diesel: any[] = [];

			await this.setStateAsync(`stations.adapterStatus`, {
				val: 'write states',
				ack: true,
			});

			if (this.config.resetValues) {
				this.writeLog(`reset all values`, 'debug');
				for (const fuelTypesKey in fuelTypes) {
					await this.setStateAsync(`stations.cheapest.${fuelTypes[fuelTypesKey]}.feed`, {
						val: 0,
						ack: true,
					});
					await this.setStateAsync(`stations.cheapest.${fuelTypes[fuelTypesKey]}.short`, {
						val: '',
						ack: true,
					});
					await this.setStateAsync(`stations.cheapest.${fuelTypes[fuelTypesKey]}.3rd`, {
						val: 0,
						ack: true,
					});
					await this.setStateAsync(`stations.cheapest.${fuelTypes[fuelTypesKey]}.combined`, {
						val: '',
						ack: true,
					});
					await this.setStateAsync(`stations.cheapest.${fuelTypes[fuelTypesKey]}.name`, {
						val: '',
						ack: true,
					});
					await this.setStateAsync(`stations.cheapest.${fuelTypes[fuelTypesKey]}.status`, {
						val: '',
						ack: true,
					});
					await this.setStateAsync(`stations.cheapest.${fuelTypes[fuelTypesKey]}.station_id`, {
						val: '',
						ack: true,
					});
				}

				for (const stationKey in station) {
					for (const fuelTypesKey in fuelTypes) {
						await this.setStateAsync(`stations.${stationKey}.${fuelTypes[fuelTypesKey]}.feed`, {
							val: 0,
							ack: true,
						});
						await this.setStateAsync(`stations.${stationKey}.${fuelTypes[fuelTypesKey]}.short`, {
							val: '',
							ack: true,
						});
						await this.setStateAsync(`stations.${stationKey}.${fuelTypes[fuelTypesKey]}.3rd`, {
							val: 0,
							ack: true,
						});
						await this.setStateAsync(
							`stations.${stationKey}.${fuelTypes[fuelTypesKey]}.combined`,
							{
								val: '',
								ack: true,
							},
						);
						await this.setStateAsync(`stations.${stationKey}.name`, {
							val: '',
							ack: true,
						});
						await this.setStateAsync(`stations.${stationKey}.status`, {
							val: '',
							ack: true,
						});
						await this.setStateAsync(`stations.${stationKey}.station_id`, {
							val: '',
							ack: true,
						});
					}
				}
			}

			if (station.length !== 1) {
				this.writeLog(` find cheapest station for e5 / e10 / diesel`, 'debug');
				for (const pricesKey in prices) {
					if (typeof prices[pricesKey].e5 !== 'undefined') {
						// find the cheapest e5
						if (prices[pricesKey].e5) {
							cheapest_e5.push({ ...prices[pricesKey], station: pricesKey });
							// sort by price in cheapest_e5
							cheapest_e5.sort((a, b) => {
								return a.e5 - b.e5;
							});
						}
					}

					// find the cheapest e10
					if (typeof prices[pricesKey].e10 !== 'undefined') {
						if (prices[pricesKey].e10) {
							cheapest_e10.push({ ...prices[pricesKey], station: pricesKey });
							// sort by price in cheapest_e10
							cheapest_e10.sort((a, b) => {
								return a.e10 - b.e10;
							});
						}
					}

					// find the cheapest diesel
					if (typeof prices[pricesKey].diesel !== 'undefined') {
						if (prices[pricesKey].diesel) {
							cheapest_diesel.push({ ...prices[pricesKey], station: pricesKey });
							// sort by price in cheapest_diesel
							cheapest_diesel.sort((a, b) => {
								return a.diesel - b.diesel;
							});
						}
					}
				}
			} else {
				this.writeLog(`only one station configured`, 'debug');
				for (const pricesKey in prices) {
					cheapest_e5.push({ ...prices[pricesKey], station: pricesKey });
					cheapest_e10.push({ ...prices[pricesKey], station: pricesKey });
					cheapest_diesel.push({ ...prices[pricesKey], station: pricesKey });
				}
			}
			// write the cheapest prices to the states
			for (const stationKey in station) {
				if (station[stationKey].station === cheapest_e5[0].station) {
					this.writeLog(`write the cheapest e5 to the states`, 'debug');

					await this.setStateAsync(`stations.cheapest.e5.feed`, {
						val: parseFloat(cheapest_e5[0].e5),
						ack: true,
					});
					await this.setStateAsync(`stations.cheapest.e5.station_id`, {
						val: cheapest_e5[0].station,
						ack: true,
					});
					await this.setStateAsync(`stations.cheapest.e5.name`, {
						val: station[stationKey].stationname,
						ack: true,
					});
					await this.setStateAsync(`stations.cheapest.e5.status`, {
						val: cheapest_e5[0].status,
						ack: true,
					});
					const cutPrice = await this.cutPrice(cheapest_e5[0].e5);
					await this.setStateAsync(`stations.cheapest.e5.3rd`, {
						val: cutPrice.price3rd,
						ack: true,
					});
					await this.setStateAsync(`stations.cheapest.e5.short`, {
						val: cutPrice.priceshort,
						ack: true,
					});

					const combined = `<span class="station_open">${cutPrice.priceshort}<sup style="font-size: 50%">${cutPrice.price3rd}</sup> <span class="station_combined_euro">€</span></span>`;
					await this.setStateAsync(`stations.cheapest.e5.combined`, {
						val: combined,
						ack: true,
					});
					this.writeLog(
						`Cheapest gas station for e5: ${station[stationKey].stationname}  id: ${cheapest_e5[0].station}`,
						'debug',
					);
				}

				if (station[stationKey].station === cheapest_e10[0].station) {
					this.writeLog(`write the cheapest e10 to the states`, 'debug');

					await this.setStateAsync(`stations.cheapest.e10.feed`, {
						val: parseFloat(cheapest_e10[0].e10),
						ack: true,
					});
					await this.setStateAsync(`stations.cheapest.e10.station_id`, {
						val: cheapest_e10[0].station,
						ack: true,
					});
					await this.setStateAsync(`stations.cheapest.e10.name`, {
						val: station[stationKey].stationname,
						ack: true,
					});
					await this.setStateAsync(`stations.cheapest.e10.status`, {
						val: cheapest_e10[0].status,
						ack: true,
					});
					const cutPrice = await this.cutPrice(cheapest_e10[0].e10);
					await this.setStateAsync(`stations.cheapest.e10.3rd`, {
						val: cutPrice.price3rd,
						ack: true,
					});
					await this.setStateAsync(`stations.cheapest.e10.short`, {
						val: cutPrice.priceshort,
						ack: true,
					});

					const combined = `<span class="station_open">${cutPrice.priceshort}<sup style="font-size: 50%">${cutPrice.price3rd}</sup> <span class="station_combined_euro">€</span></span>`;
					await this.setStateAsync(`stations.cheapest.e10.combined`, {
						val: combined,
						ack: true,
					});
					this.writeLog(
						`Cheapest gas station for e10: ${station[stationKey].stationname}  id: ${cheapest_e10[0].station}`,
						'debug',
					);
				}

				if (station[stationKey].station === cheapest_diesel[0].station) {
					this.writeLog(`write the cheapest diesel to the states`, 'debug');

					await this.setStateAsync(`stations.cheapest.diesel.feed`, {
						val: parseFloat(cheapest_diesel[0].diesel),
						ack: true,
					});
					await this.setStateAsync(`stations.cheapest.diesel.station_id`, {
						val: cheapest_diesel[0].station,
						ack: true,
					});
					await this.setStateAsync(`stations.cheapest.diesel.name`, {
						val: station[stationKey].stationname,
						ack: true,
					});
					await this.setStateAsync(`stations.cheapest.diesel.status`, {
						val: cheapest_diesel[0].status,
						ack: true,
					});
					const cutPrice = await this.cutPrice(cheapest_diesel[0].diesel);
					await this.setStateAsync(`stations.cheapest.diesel.3rd`, {
						val: cutPrice.price3rd,
						ack: true,
					});
					await this.setStateAsync(`stations.cheapest.diesel.short`, {
						val: cutPrice.priceshort,
						ack: true,
					});
					const combined = `<span class="station_open">${cutPrice.priceshort}<sup style="font-size: 50%">${cutPrice.price3rd}</sup> <span class="station_combined_euro">€</span></span>`;
					await this.setStateAsync(`stations.cheapest.diesel.combined`, {
						val: combined,
						ack: true,
					});
					this.writeLog(
						`Cheapest gas station for diesel: ${station[stationKey].stationname}  id: ${cheapest_diesel[0].station}`,
						'debug',
					);
				}
			}

			// write all available stations to state
			for (const stationsKey in station) {
				for (const pricesKey in prices) {
					if (station[stationsKey].station === pricesKey) {
						await this.setStateAsync(`stations.${stationsKey}.name`, {
							val: station[stationsKey].stationname,
							ack: true,
						});

						await this.setStateAsync(`stations.${stationsKey}.station_id`, {
							val: station[stationsKey].station,
							ack: true,
						});

						await this.setStateAsync(`stations.${stationsKey}.status`, {
							val: prices[station[stationsKey].station].status,
							ack: true,
						});

						if (prices[station[stationsKey].station].status === 'open') {
							for (const key in fuelTypes) {
								if (prices[station[stationsKey].station][fuelTypes[key]]) {
									await this.setStateAsync(
										`stations.${stationsKey}.${fuelTypes[key]}.feed`,
										{
											val: parseFloat(
												prices[station[stationsKey].station][fuelTypes[key]],
											),
											ack: true,
										},
									);
									const pricesObj = await this.cutPrice(
										prices[station[stationsKey].station][fuelTypes[key]],
									);
									await this.setStateAsync(
										`stations.${stationsKey}.${fuelTypes[key]}.3rd`,
										{
											val: pricesObj.price3rd,
											ack: true,
										},
									);
									await this.setStateAsync(
										`stations.${stationsKey}.${fuelTypes[key]}.short`,
										{
											val: pricesObj.priceshort,
											ack: true,
										},
									);

									const combined = `<span class="station_open">${pricesObj.priceshort}<sup style="font-size: 50%">${pricesObj.price3rd}</sup> <span class="station_combined_euro">€</span></span>`;
									await this.setStateAsync(
										`stations.${stationsKey}.${fuelTypes[key]}.combined`,
										{
											val: combined,
											ack: true,
										},
									);
								} else {
									this.writeLog(
										`There is no ${key} in the ${station[stationsKey].stationname} ID: ${station[stationsKey].station} station.`,
										'debug',
									);
								}
							}
						} else if (prices[station[stationsKey].station].status === 'closed') {
							for (const key in fuelTypes) {
								await this.setStateAsync(
									`stations.${stationsKey}.${fuelTypes[key]}.combined`,
									{
										val: `<span class="station_closed">Station Closed</span>`,
										ack: true,
									},
								);
							}
							this.writeLog(`${station[stationsKey].stationname} is Closed`, `debug`);
						} else if (prices[station[stationsKey].station].status === 'no prices') {
							for (const key in fuelTypes) {
								await this.setStateAsync(
									`stations.${stationsKey}.${fuelTypes[key]}.combined`,
									{
										val: `<span class="station_no_prices">No Prices</span>`,
										ack: true,
									},
								);
							}
							this.writeLog(
								`there are no prices at ${station[stationsKey].stationname}`,
								`warn`,
							);
						} else if (
							prices[station[stationsKey].station].status === 'not found' ||
							prices[station[stationsKey].station].status === 'no stations'
						) {
							for (const key in fuelTypes) {
								await this.setStateAsync(
									`stations.${stationsKey}.${fuelTypes[key]}.combined`,
									{
										val: `<span class="station_notfound">not found</span>`,
										ack: true,
									},
								);
							}
							this.writeLog(
								`station ${station[stationsKey].stationname} with ID: ${station[stationsKey].station} was not found`,
								`warn`,
							);
						}
					}
				}
			}
		} catch (error) {
			this.writeLog(`writeState error: ${error} stack: ${error.stack}`, 'error');
		}
	}

	private async cutPrice(
		price: string | number | boolean | undefined,
	): Promise<{ priceshort: string; price3rd: number }> {
		this.writeLog(`cutPrice: ${price} price type ${typeof price}`, 'debug');
		if (price === undefined) {
			return { priceshort: '0', price3rd: 0 };
		}
		if (typeof price === 'string') {
			price = parseFloat(price);
		}
		if (typeof price === 'boolean') {
			price = 0;
		}

		/** old version still leave in case something is wrong
		 * this.writeLog(`price: ${price}`, 'debug');
		 * let temp = price * 100; // 100x price now with one decimal place
		 * const temp2 = price * 1000; // 1000x price without decimal place
		 * temp = Math.floor(temp); // Decimal place (.x) is truncated
		 * temp = temp / 100; // two decimal places remain
		 * const price_short = temp.toFixed(2); // Output price with 2 decimal places (truncated)
		 * const price_3rd_digit = temp2 % 10; // Determine third decimal place individually
		 * return {
		 * 	priceshort: price_short, // als String wg. Nullen z.B. 1.10 statt 1.1
		 * 	price3rd: price_3rd_digit,
		 * };
		 */

		// new cutPrice version Will still be tested
		this.writeLog(`price: ${price}`, 'debug');
		price = price.toFixed(3);
		this.writeLog(` price.toFixed(3): ${price}`, 'debug');
		const priceshort = price.slice(0, price.length - 1);
		this.writeLog(` priceshort: ${priceshort}`, 'debug');
		const price3rd = parseInt(price.slice(-1));
		this.writeLog(` price3rd: ${price3rd}`, 'debug');

		return {
			priceshort,
			price3rd,
		};
	}

	/**
	 * Function to create all Folder and states for the stations
	 */
	private async createAllStates(stations: ioBroker.Station[]): Promise<void> {
		try {
			this.writeLog('all states are now created', 'debug');

			//  create all channel
			await this.setObjectNotExistsAsync('stations', {
				type: 'channel',
				common: {
					name: 'Tankstellen',
				},
				native: {},
			});

			await this.setObjectNotExistsAsync('stations.cheapest', {
				type: 'channel',
				common: {
					name: 'günstigste Tankstellen',
				},
				native: {},
			});

			// create the cheapest folder and states
			for (const fuelTypesKey in fuelTypes) {
				await this.setObjectNotExistsAsync(`stations.cheapest.${fuelTypes[fuelTypesKey]}`, {
					type: 'channel',
					common: {
						name: `günstigste ${fuelTypes[fuelTypesKey].toUpperCase()}`,
					},
					native: {},
				});
			}

			for (const fuelTypesKey in fuelTypes) {
				for (const statesObjKey in statesObj) {
					await this.setObjectNotExistsAsync(
						`stations.cheapest.${fuelTypes[fuelTypesKey]}.${statesObjKey}`,
						statesObj[statesObjKey],
					);
				}
				for (const priceObjKey in priceObj) {
					await this.setObjectNotExistsAsync(
						`stations.cheapest.${fuelTypes[fuelTypesKey]}.${priceObjKey}`,
						{
							...priceObj[priceObjKey],
							common: {
								...priceObj[priceObjKey].common,
								name: `günstigste ${fuelTypes[fuelTypesKey]} ${priceObjKey}`,
							},
						},
					);
				}
			}

			// create all other folder and states
			for (const stationsKey in stations) {
				if (parseFloat(stationsKey) <= 9) {
					if (stations.hasOwnProperty(stationsKey)) {
						const station: { station: string; stationname: string } = stations[stationsKey];
						await this.setObjectNotExistsAsync(`stations.${stationsKey}`, {
							type: 'channel',
							common: {
								name: station.stationname,
							},
							native: {},
						});

						let objects = null;
						objects = await this.getObjectAsync(`stations.${stationsKey}`);
						if (objects !== null && objects !== undefined) {
							const { common } = objects;
							if (common.name !== station.stationname) {
								await this.extendObjectAsync(`stations.${stationsKey}`, {
									type: 'channel',
									common: {
										name: station.stationname,
									},
									native: {},
								});
							}
						}
						for (const fuelTypesKey in fuelTypes) {
							await this.setObjectNotExistsAsync(
								`stations.${stationsKey}.${fuelTypes[fuelTypesKey]}`,
								{
									type: 'channel',
									common: {
										name: fuelTypes[fuelTypesKey].toUpperCase(),
									},
									native: {},
								},
							);
						}

						for (const statesObjKey in statesObj) {
							await this.setObjectNotExistsAsync(
								`stations.${stationsKey}.${statesObjKey}`,
								statesObj[statesObjKey],
							);
						}

						for (const fuelTypesKey in fuelTypes) {
							for (const priceObjKey in priceObj) {
								await this.setObjectNotExistsAsync(
									`stations.${stationsKey}.${fuelTypes[fuelTypesKey]}.${priceObjKey}`,
									{
										...priceObj[priceObjKey],
										common: {
											...priceObj[priceObjKey].common,
											name: `${fuelTypes[fuelTypesKey]} ${priceObjKey}`,
										},
									},
								);
							}
						}
					}
				}
			}
			await this.setObjectNotExistsAsync(`stations.json`, {
				type: 'state',
				common: {
					name: 'tankerkoenig JSON',
					desc: 'JSON return from tankerkoenig.de with all prices for all stations',
					type: `string`,
					role: `json`,
					def: '',
					read: true,
					write: false,
				},
				native: {},
			});

			await this.setObjectNotExistsAsync(`stations.lastUpdate`, {
				type: 'state',
				common: {
					name: 'tankerkoenig last update',
					desc: 'last update of tankerkoenig.de',
					type: `number`,
					role: `value.time`,
					def: 0,
					read: true,
					write: false,
				},
				native: {},
			});

			await this.setObjectNotExistsAsync(`stations.adapterStatus`, {
				type: 'state',
				common: {
					name: 'adapter status',
					desc: 'adapter status',
					type: `string`,
					role: `info.status`,
					def: 'idle',
					read: true,
					write: false,
				},
				native: {},
			});

			await this.setObjectNotExistsAsync(`stations.refresh`, {
				type: 'state',
				common: {
					name: 'manuel refresh the data from tankerkoenig.de',
					desc: 'refresh the data from tankerkoenig.de',
					type: `boolean`,
					role: `button`,
					def: false,
					read: true,
					write: true,
				},
				native: {},
			});
			await this.subscribeStates(`stations.refresh`);

			// end of create objects
		} catch (e) {
			this.writeLog(`Error creating all states: ${e}`, 'error');
		}
	}

	/**
	 * a function for log output
	 */
	private writeLog(logtext: string, logtype: 'silly' | 'info' | 'debug' | 'warn' | 'error'): void {
		try {
			if (!optionNoLog) {
				// Ausgabe bei info, debug und error
				if (logtype === 'silly') this.log.silly(logtext);
				if (logtype === 'info') this.log.info(logtext);
				if (logtype === 'debug') this.log.debug(logtext);
				if (logtype === 'warn') this.log.warn(logtext);
				if (logtype === 'error') this.log.error(logtext);
			} else {
				// Ausgabe nur bei error
				if (logtype === 'error') this.log.error(logtext);
			}
		} catch (error) {
			this.log.error(`writeLog error: ${error} , stack: ${error.stack}`);
		}
	}

	/**
	 * Is called when adapter shuts down - callback has to be called under any circumstances!
	 */
	private async onUnload(callback: () => void): Promise<void> {
		try {
			// Here you must clear all timeouts or intervals that may still be active
			if (requestTimeout) clearInterval(requestTimeout);
			if (refreshTimeout) clearInterval(refreshTimeout);
			if (refreshStatusTimeout) clearTimeout(refreshStatusTimeout);

			await this.setStateAsync(`stations.adapterStatus`, {
				val: 'offline',
				ack: true,
			});
			callback();
		} catch (e) {
			callback();
		}
	}

	/**
	 * Is called if a subscribed state changes
	 */
	private async onStateChange(id: string, state: ioBroker.State | null | undefined): Promise<void> {
		try {
			if (state) {
				if (id === `${this.namespace}.stations.refresh`) {
					if (state.val && !state.ack) {
						// set refresh to timeout to 1min to prevent multiple refreshes
						if (!refreshTimeout) {
							this.writeLog(`refresh timeout set to 1min`, 'info');
							refreshTimeout = setTimeout(async () => {
								this.writeLog(`refresh again possible`, 'info');
								refreshTimeout = null;
								refreshStatus = false;
							}, 60000);
						}
						if (!refreshStatus) {
							refreshStatus = true;

							this.writeLog('manuel refresh the data from tankerkoenig.de', 'info');
							await this.setStateAsync(`stations.adapterStatus`, {
								val: 'manuel request',
								ack: true,
							});
							await this.requestData();
						} else {
							this.writeLog(
								'too short time between manual refreshes, manual request is allowed only once per min.',
								'warn',
							);
							await this.setStateAsync(`stations.adapterStatus`, {
								val: 'request timeout 1min',
								ack: true,
							});
							if (refreshStatusTimeout) clearTimeout(refreshStatusTimeout);
							refreshStatusTimeout = setTimeout(async () => {
								await this.setStateAsync(`stations.adapterStatus`, {
									val: 'idle',
									ack: true,
								});
							}, 5000);
						}
					}
				}
			}
		} catch (e) {
			this.writeLog(`[onStateChane ${id}] error: ${e} , stack: ${e.stack}`, 'error');
		}
	}
}

if (require.main !== module) {
	// Export the constructor in compact mode
	module.exports = (options: Partial<utils.AdapterOptions> | undefined) => new Tankerkoenig(options);
} else {
	// otherwise start the instance directly
	(() => new Tankerkoenig())();
}
