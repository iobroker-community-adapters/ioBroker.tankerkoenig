/*
 * Created with @iobroker/create-adapter v2.0.1
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
import * as utils from '@iobroker/adapter-core';
import axios from 'axios';
import { CreateJsonTable } from './lib/interface/CreateJsonTable';

// Load your modules here, e.g.:
import { priceMinMaxObj, priceObj, statesObj } from './lib/object_definition';
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
		this.on('unload', this.onUnload.bind(this));
		// this.on('message', this.onMessage.bind(this));
	}

	/**
	 * @description Is called when databases are connected and adapter received configuration.
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

		// check if api key is set and Station is set
		if (this.config.apikey.length === 36) {
			if (this.config.station.length > 0) {
				await this.createAllStates(this.config.station);
				await this.requestData();
			} else {
				this.writeLog(`No stations defined`, 'error');
			}
		} else {
			this.writeLog(`No Api Key is specified`, 'error');
		}
	}

	/**
	 * @description request data from tankerkoenig
	 */
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
							const price = await this.setDiscount(response.data.prices);

							await this.writeState(price);
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

	/**
	 * @description set the discount to the price if it is configured
	 */
	private async setDiscount(price: Result): Promise<Result> {
		try {
			const station = this.config.station;
			for (const stationValue of station) {
				for (const [stationID, pricesValue] of Object.entries(price)) {
					if (stationID === stationValue.station) {
						if (stationValue.discounted) {
							stationValue.discountObj.fuelType.map(async (fuelType) => {
								for (const [key, priceValue] of Object.entries(pricesValue)) {
									if (fuelType === key) {
										if (stationValue.discountObj.discountType === 'absolute') {
											pricesValue[fuelType] = await this.addDiscount(
												priceValue,
												stationValue.discountObj.discount,
												stationValue.discountObj.discountType,
											);
										} else if (stationValue.discountObj.discountType === 'percent') {
											pricesValue[fuelType] = await this.addDiscount(
												priceValue,
												stationValue.discountObj.discount,
												stationValue.discountObj.discountType,
											);
										}
									}
								}
							});
						}
					}
				}
			}
			// return the prices with the discount
			return price;
		} catch (error) {
			this.writeLog(`setDiscount error: ${error} stack: ${error.stack}`, 'error');
			return price;
		}
	}

	/**
	 * @description request old state
	 */
	private async oldState(id: string): Promise<any> {
		try {
			const oldState = await this.getStateAsync(id);
			return oldState ? oldState.val : null;
		} catch (error) {
			this.writeLog(`[ oldState ] error: ${error} stack: ${error.stack}`, 'error');
			return null;
		}
	}

	/**
	 * @description request day of state
	 */
	private async dayState(id: string): Promise<any> {
		try {
			const dayState = await this.getStateAsync(id);
			let day;
			if (dayState) {
				const date = new Date(dayState.ts);
				day = date.getDate();
			} else {
				day = null;
			}
			return day;
		} catch (error) {
			this.writeLog(`[ oldState ] error: ${error} stack: ${error.stack}`, 'error');
			return null;
		}
	}

	/**
	 * @description write the states to the adapter
	 */
	private async writeState(prices: Result): Promise<void> {
		try {
			const station = this.config.station;
			let openStationsE5: any[] = [];
			const cheapest_e5: any[] = [];
			const cheapest_e10: any[] = [];
			let openStationsE10: any[] = [];
			const cheapest_diesel: any[] = [];
			let openStationsDiesel: any[] = [];

			await this.setStateAsync(`stations.adapterStatus`, {
				val: 'write states',
				ack: true,
			});

			if (station.length !== 1) {
				this.writeLog(` find cheapest station for e5 / e10 / diesel`, 'debug');
				for (const [stationID, pricesValue] of Object.entries(prices)) {
					if (pricesValue.status === 'open') {
						if (typeof pricesValue.e5 !== 'undefined') {
							if (pricesValue.e5) {
								cheapest_e5.push({ ...pricesValue, station: stationID });
								//filter the open stations
								openStationsE5 = cheapest_e5.filter((station) => station.status === 'open');
								openStationsE5.sort((a, b) => a.e5 - b.e5);
							}
						}

						// find the cheapest e10
						if (typeof pricesValue.e10 !== 'undefined') {
							if (pricesValue.e10) {
								cheapest_e10.push({ ...pricesValue, station: stationID });
								//filter the open stations
								openStationsE10 = cheapest_e10.filter((station) => station.status === 'open');
								openStationsE10.sort((a, b) => a.e10 - b.e10);
							}
						}

						// find the cheapest diesel
						if (typeof pricesValue.diesel !== 'undefined') {
							if (pricesValue.diesel) {
								cheapest_diesel.push({ ...pricesValue, station: stationID });
								//filter the open stations
								openStationsDiesel = cheapest_diesel.filter(
									(station) => station.status === 'open',
								);
								openStationsDiesel.sort((a, b) => a.diesel - b.diesel);
							}
						}
					} else {
						this.writeLog(` station ${stationID} is closed`, 'debug');
						if (typeof pricesValue.status !== 'undefined') {
							cheapest_e5.push({ ...pricesValue, station: stationID });
						}
						if (typeof pricesValue.status !== 'undefined') {
							cheapest_e10.push({ ...pricesValue, station: stationID });
						}
						if (typeof pricesValue.status !== 'undefined') {
							cheapest_diesel.push({ ...pricesValue, station: stationID });
						}
					}
				}
			} else {
				this.writeLog(`only one station configured`, 'debug');
				for (const [stationID, pricesValue] of Object.entries(prices)) {
					if (pricesValue.status === 'open') {
						cheapest_e5.push({ ...pricesValue, station: stationID });
						cheapest_e10.push({ ...pricesValue, station: stationID });
						cheapest_diesel.push({ ...pricesValue, station: stationID });
					} else {
						this.writeLog(` station ${stationID} is closed`, 'debug');
						if (typeof pricesValue.status !== 'undefined') {
							cheapest_e5.push({ ...pricesValue, station: stationID });
						}
						if (typeof pricesValue.status !== 'undefined') {
							cheapest_e10.push({ ...pricesValue, station: stationID });
						}
						if (typeof pricesValue.status !== 'undefined') {
							cheapest_diesel.push({ ...pricesValue, station: stationID });
						}
					}
				}
			}

			// write all prices to the states
			for (const [key, stationValue] of Object.entries(station)) {
				const newE5 = openStationsE5.length > 0 ? openStationsE5 : cheapest_e5;
				const newE10 = openStationsE10.length > 0 ? openStationsE10 : cheapest_e10;
				const newDiesel = openStationsDiesel.length > 0 ? openStationsDiesel : cheapest_diesel;

				this.writeLog(` cheapest e5: ${newE5[0].e5} at ${newE5[0].station} array: ${newE5}`, 'debug');
				this.writeLog(
					` cheapest e10: ${newE10[0].e10} at ${newE10[0].station} array: ${newE10}`,
					'debug',
				);
				this.writeLog(
					` cheapest diesel: ${newDiesel[0].diesel} at ${newDiesel[0].station} array: ${newDiesel}`,
					'debug',
				);

				if (stationValue.station === newE5[0].station) {
					this.writeLog(`write the cheapest e5 to the states`, 'debug');
					if (newE5[0].status === 'open') {
						await this.setStateAsync(`stations.cheapest.e5.feed`, {
							val: parseFloat(newE5[0].e5),
							ack: true,
						});

						await this.setStateAsync(`stations.cheapest.e5.station_id`, {
							val: newE5[0].station,
							ack: true,
						});

						await this.setStateAsync(`stations.cheapest.e5.name`, {
							val: stationValue.stationname,
							ack: true,
						});

						await this.setStateAsync(`stations.cheapest.e5.status`, {
							val: newE5[0].status,
							ack: true,
						});

						await this.setStateAsync(`stations.cheapest.e5.discounted`, {
							val: stationValue.discounted,
							ack: true,
						});

						await this.setStateAsync(`stations.cheapest.e5.discount`, {
							val: stationValue.discountObj.discount,
							ack: true,
						});

						const cutPrice = await this.cutPrice(newE5[0].e5);
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
							`Cheapest gas station for e5: ${stationValue.stationname}  id: ${newE5[0].station}`,
							'debug',
						);
					} else {
						await this.setStateAsync(`stations.cheapest.e5.feed`, {
							val: await this.oldState(`stations.cheapest.e5.feed`),
							ack: true,
							q: 0x40,
						});

						const short = await this.oldState(`stations.cheapest.e5.short`);
						await this.setStateAsync(`stations.cheapest.e5.short`, {
							val: short.toString(),
							ack: true,
							q: 0x40,
						});

						await this.setStateAsync(`stations.cheapest.e5.combined`, {
							val:
								prices[stationValue.station].status === 'closed'
									? `<span class="station_closed">${this.config.combinedOptions.closed}</span>`
									: prices[stationValue.station].status === 'no prices'
									? `<span class="station_no_prices">${this.config.combinedOptions.noPrice}</span>`
									: prices[stationValue.station].status === 'not found' ||
									  prices[stationValue.station].status === 'no stations'
									? `<span class="station_not_found">${this.config.combinedOptions.notFound}</span>`
									: null,
							ack: true,
						});

						await this.setStateAsync(`stations.cheapest.e5.status`, {
							val: newE5[0].status,
							ack: true,
						});
					}
				}

				if (stationValue.station === newE10[0].station) {
					this.writeLog(`write the cheapest e10 to the states`, 'debug');
					if (newE10[0].status === 'open') {
						await this.setStateAsync(`stations.cheapest.e10.feed`, {
							val: parseFloat(newE10[0].e10),
							ack: true,
						});

						await this.setStateAsync(`stations.cheapest.e10.station_id`, {
							val: newE10[0].station,
							ack: true,
						});

						await this.setStateAsync(`stations.cheapest.e10.name`, {
							val: stationValue.stationname,
							ack: true,
						});

						await this.setStateAsync(`stations.cheapest.e10.status`, {
							val: newE10[0].status,
							ack: true,
						});

						await this.setStateAsync(`stations.cheapest.e10.discounted`, {
							val: stationValue.discounted,
							ack: true,
						});

						await this.setStateAsync(`stations.cheapest.e10.discount`, {
							val: stationValue.discountObj.discount,
							ack: true,
						});

						const cutPrice = await this.cutPrice(newE10[0].e10);
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
							`Cheapest gas station for e10: ${stationValue.stationname}  id: ${newE10[0].station}`,
							'debug',
						);
					} else {
						await this.setStateAsync(`stations.cheapest.e10.feed`, {
							val: await this.oldState(`stations.cheapest.e10.feed`),
							ack: true,
							q: 0x40,
						});

						const short = await this.oldState(`stations.cheapest.e10.short`);
						await this.setStateAsync(`stations.cheapest.e10.short`, {
							val: short.toString(),
							ack: true,
							q: 0x40,
						});

						await this.setStateAsync(`stations.cheapest.e10.combined`, {
							val:
								prices[stationValue.station].status === 'closed'
									? `<span class="station_closed">${this.config.combinedOptions.closed}</span>`
									: prices[stationValue.station].status === 'no prices'
									? `<span class="station_no_prices">${this.config.combinedOptions.noPrice}</span>`
									: prices[stationValue.station].status === 'not found' ||
									  prices[stationValue.station].status === 'no stations'
									? `<span class="station_not_found">${this.config.combinedOptions.notFound}</span>`
									: null,
							ack: true,
						});

						await this.setStateAsync(`stations.cheapest.e10.status`, {
							val: newE10[0].status,
							ack: true,
						});
					}
				}

				if (stationValue.station === newDiesel[0].station) {
					this.writeLog(`write the cheapest diesel to the states`, 'debug');
					if (newDiesel[0].status === 'open') {
						await this.setStateAsync(`stations.cheapest.diesel.feed`, {
							val: parseFloat(newDiesel[0].diesel),
							ack: true,
						});

						await this.setStateAsync(`stations.cheapest.diesel.station_id`, {
							val: newDiesel[0].station,
							ack: true,
						});

						await this.setStateAsync(`stations.cheapest.diesel.name`, {
							val: stationValue.stationname,
							ack: true,
						});

						await this.setStateAsync(`stations.cheapest.diesel.status`, {
							val: newDiesel[0].status,
							ack: true,
						});

						await this.setStateAsync(`stations.cheapest.diesel.discounted`, {
							val: stationValue.discounted,
							ack: true,
						});

						await this.setStateAsync(`stations.cheapest.diesel.discount`, {
							val: stationValue.discountObj.discount,
							ack: true,
						});

						const cutPrice = await this.cutPrice(newDiesel[0].diesel);
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
							`Cheapest gas station for diesel: ${stationValue.stationname}  id: ${newDiesel[0].station}`,
							'debug',
						);
					} else {
						await this.setStateAsync(`stations.cheapest.diesel.feed`, {
							val: await this.oldState(`stations.cheapest.diesel.feed`),
							ack: true,
							q: 0x40,
						});

						const short = await this.oldState(`stations.cheapest.diesel.short`);
						await this.setStateAsync(`stations.cheapest.diesel.short`, {
							val: short.toString(),
							ack: true,
							q: 0x40,
						});

						await this.setStateAsync(`stations.cheapest.diesel.combined`, {
							val:
								prices[stationValue.station].status === 'closed'
									? `<span class="station_closed">${this.config.combinedOptions.closed}</span>`
									: prices[stationValue.station].status === 'no prices'
									? `<span class="station_no_prices">${this.config.combinedOptions.noPrice}</span>`
									: prices[stationValue.station].status === 'not found' ||
									  prices[stationValue.station].status === 'no stations'
									? `<span class="station_not_found">${this.config.combinedOptions.notFound}</span>`
									: null,
							ack: true,
						});

						await this.setStateAsync(`stations.cheapest.diesel.status`, {
							val: newDiesel[0].status,
							ack: true,
						});
					}
				}

				// write all available stations to state
				for (const [pricesKey] of Object.entries(prices)) {
					if (stationValue.station === pricesKey) {
						await this.setStateAsync(`stations.${key}.name`, {
							val: stationValue.stationname,
							ack: true,
						});

						await this.setStateAsync(`stations.${key}.station_id`, {
							val: stationValue.station,
							ack: true,
						});

						await this.setStateAsync(`stations.${key}.status`, {
							val: prices[stationValue.station].status,
							ack: true,
						});

						await this.setStateAsync(`stations.${key}.discounted`, {
							val: stationValue.discounted,
							ack: true,
						});
						await this.setStateAsync(`stations.${key}.discount`, {
							val: stationValue.discountObj.discount,
							ack: true,
						});

						// Reset min/max at new day
						for (const fuelTypesKey in fuelTypes) {
							if (fuelTypes.hasOwnProperty(fuelTypesKey)) {
								const feedMinDay = await this.dayState(
									`stations.${key}.${fuelTypes[fuelTypesKey]}.minmax.feed_min`,
								);
								const now = new Date();
								if (now.getDate() !== feedMinDay) {
									await this.setStateAsync(
										`stations.${key}.${fuelTypes[fuelTypesKey]}.minmax.feed_min`,
										{
											val: 0,
											ack: true,
										},
									);
									await this.setStateAsync(
										`stations.${key}.${fuelTypes[fuelTypesKey]}.minmax.lastUpdate_min`,
										{
											val: Date.now(),
											ack: true,
										},
									);

									await this.setStateAsync(
										`stations.${key}.${fuelTypes[fuelTypesKey]}.minmax.lastUpdate_max`,
										{
											val: Date.now(),
											ack: true,
										},
									);

									await this.setStateAsync(
										`stations.${key}.${fuelTypes[fuelTypesKey]}.minmax.3rd_min`,
										{
											val: 0,
											ack: true,
										},
									);

									await this.setStateAsync(
										`stations.${key}.${fuelTypes[fuelTypesKey]}.minmax.short_min`,
										{
											val: '0',
											ack: true,
										},
									);

									await this.setStateAsync(
										`stations.${key}.${fuelTypes[fuelTypesKey]}.minmax.combined_min`,
										{
											val: '',
											ack: true,
										},
									);

									await this.setStateAsync(
										`stations.${key}.${fuelTypes[fuelTypesKey]}.minmax.feed_max`,
										{
											val: 0,
											ack: true,
										},
									);

									await this.setStateAsync(
										`stations.${key}.${fuelTypes[fuelTypesKey]}.minmax.3rd_max`,
										{
											val: 0,
											ack: true,
										},
									);

									await this.setStateAsync(
										`stations.${key}.${fuelTypes[fuelTypesKey]}.minmax.short_max`,
										{
											val: '0',
											ack: true,
										},
									);

									await this.setStateAsync(
										`stations.${key}.${fuelTypes[fuelTypesKey]}.minmax.combined_max`,
										{
											val: '',
											ack: true,
										},
									);
									this.writeLog(
										`Min/Max prices have been reset, because we have an new day. Today: ${now.getDate()} // Day of ${key}.${
											fuelTypes[fuelTypesKey]
										}.minmax.feed_min: ${feedMinDay}`,
										'debug',
									);
								}
							}
						}

						if (prices[stationValue.station].status === 'open') {
							for (const fuelTypesKey in fuelTypes) {
								if (fuelTypes.hasOwnProperty(fuelTypesKey)) {
									if (prices[stationValue.station][fuelTypes[fuelTypesKey]]) {
										await this.setStateAsync(
											`stations.${key}.${fuelTypes[fuelTypesKey]}.feed`,
											{
												val: parseFloat(
													prices[stationValue.station][fuelTypes[fuelTypesKey]],
												),
												ack: true,
											},
										);

										const pricesObj = await this.cutPrice(
											prices[stationValue.station][fuelTypes[fuelTypesKey]],
										);

										await this.setStateAsync(
											`stations.${key}.${fuelTypes[fuelTypesKey]}.3rd`,
											{
												val: pricesObj.price3rd,
												ack: true,
											},
										);

										await this.setStateAsync(
											`stations.${key}.${fuelTypes[fuelTypesKey]}.short`,
											{
												val: pricesObj.priceshort,
												ack: true,
											},
										);

										const combined = `<span class="station_open">${pricesObj.priceshort}<sup style="font-size: 50%">${pricesObj.price3rd}</sup> <span class="station_combined_euro">€</span></span>`;
										await this.setStateAsync(
											`stations.${key}.${fuelTypes[fuelTypesKey]}.combined`,
											{
												val: combined,
												ack: true,
											},
										);

										// min prices
										const feed_min = await this.oldState(
											`stations.${key}.${fuelTypes[fuelTypesKey]}.minmax.feed_min`,
										);
										if (
											(feed_min >=
												parseFloat(
													prices[stationValue.station][fuelTypes[fuelTypesKey]],
												) ||
												feed_min === 0) &&
											(feed_min !== undefined || feed_min !== null)
										) {
											if (
												feed_min >
												parseFloat(
													prices[stationValue.station][fuelTypes[fuelTypesKey]],
												)
											) {
												await this.setStateAsync(
													`stations.${key}.${fuelTypes[fuelTypesKey]}.minmax.lastUpdate_min`,
													{
														val: Date.now(),
														ack: true,
													},
												);
											}

											this.writeLog(
												`New minimum price for ${key}.${
													fuelTypes[fuelTypesKey]
												}: ${parseFloat(
													prices[stationValue.station][fuelTypes[fuelTypesKey]],
												)}`,
												'debug',
											);

											await this.setStateAsync(
												`stations.${key}.${fuelTypes[fuelTypesKey]}.minmax.feed_min`,
												{
													val: parseFloat(
														prices[stationValue.station][fuelTypes[fuelTypesKey]],
													),
													ack: true,
												},
											);

											await this.setStateAsync(
												`stations.${key}.${fuelTypes[fuelTypesKey]}.minmax.3rd_min`,
												{
													val: pricesObj.price3rd,
													ack: true,
												},
											);

											await this.setStateAsync(
												`stations.${key}.${fuelTypes[fuelTypesKey]}.minmax.short_min`,
												{
													val: pricesObj.priceshort,
													ack: true,
												},
											);

											await this.setStateAsync(
												`stations.${key}.${fuelTypes[fuelTypesKey]}.minmax.combined_min`,
												{
													val: combined,
													ack: true,
												},
											);
										}

										// max prices from feed
										const feed_max = await this.oldState(
											`stations.${key}.${fuelTypes[fuelTypesKey]}.minmax.feed_max`,
										);
										if (
											(feed_max <=
												parseFloat(
													prices[stationValue.station][fuelTypes[fuelTypesKey]],
												) ||
												feed_max === 0) &&
											(feed_max !== undefined || feed_max !== null)
										) {
											if (
												feed_max <
												parseFloat(
													prices[stationValue.station][fuelTypes[fuelTypesKey]],
												)
											) {
												await this.setStateAsync(
													`stations.${key}.${fuelTypes[fuelTypesKey]}.minmax.lastUpdate_max`,
													{
														val: Date.now(),
														ack: true,
													},
												);
											}
											this.writeLog(
												`New maximum price for ${key}.${
													fuelTypes[fuelTypesKey]
												}: ${parseFloat(
													prices[stationValue.station][fuelTypes[fuelTypesKey]],
												)}`,
												'debug',
											);
											await this.setStateAsync(
												`stations.${key}.${fuelTypes[fuelTypesKey]}.minmax.feed_max`,
												{
													val: parseFloat(
														prices[stationValue.station][fuelTypes[fuelTypesKey]],
													),
													ack: true,
												},
											);

											await this.setStateAsync(
												`stations.${key}.${fuelTypes[fuelTypesKey]}.minmax.3rd_max`,
												{
													val: pricesObj.price3rd,
													ack: true,
												},
											);

											await this.setStateAsync(
												`stations.${key}.${fuelTypes[fuelTypesKey]}.minmax.short_max`,
												{
													val: pricesObj.priceshort,
													ack: true,
												},
											);

											await this.setStateAsync(
												`stations.${key}.${fuelTypes[fuelTypesKey]}.minmax.combined_max`,
												{
													val: combined,
													ack: true,
												},
											);
										}
									} else {
										const short = await this.oldState(
											`stations.${key}.${fuelTypes[fuelTypesKey]}.short`,
										);
										await this.setStateAsync(
											`stations.${key}.${fuelTypes[fuelTypesKey]}.short`,
											{
												val: short.toString(),
												ack: true,
												q: 0x40,
											},
										);

										await this.setStateAsync(
											`stations.${key}.${fuelTypes[fuelTypesKey]}.feed`,
											{
												val: await this.oldState(
													`stations.${key}.${fuelTypes[fuelTypesKey]}.feed`,
												),
												ack: true,
												q: 0x40,
											},
										);

										await this.setStateAsync(
											`stations.${key}.${fuelTypes[fuelTypesKey]}.combined`,
											{
												val: `<span class="station_no_prices">${this.config.combinedOptions.noPrice}</span>`,
												ack: true,
											},
										);

										await this.setStateAsync(
											`stations.${key}.${fuelTypes[fuelTypesKey]}.minmax.feed_min`,
											{
												val: await this.oldState(
													`stations.${key}.${fuelTypes[fuelTypesKey]}.minmax.feed_min`,
												),
												ack: true,
												q: 0x40,
											},
										);

										const shortmin = await this.oldState(
											`stations.${key}.${fuelTypes[fuelTypesKey]}.minmax.short_min`,
										);
										await this.setStateAsync(
											`stations.${key}.${fuelTypes[fuelTypesKey]}.minmax.short_min`,
											{
												val: shortmin.toString(),
												ack: true,
												q: 0x40,
											},
										);

										await this.setStateAsync(
											`stations.${key}.${fuelTypes[fuelTypesKey]}.minmax.combined_min`,
											{
												val: `<span class="station_no_prices">${this.config.combinedOptions.noPrice}</span>`,
												ack: true,
											},
										);

										await this.setStateAsync(
											`stations.${key}.${fuelTypes[fuelTypesKey]}.minmax.feed_max`,
											{
												val: await this.oldState(
													`stations.${key}.${fuelTypes[fuelTypesKey]}.minmax.feed_max`,
												),
												ack: true,
												q: 0x40,
											},
										);

										const shortmax = await this.oldState(
											`stations.${key}.${fuelTypes[fuelTypesKey]}.minmax.short_max`,
										);
										await this.setStateAsync(
											`stations.${key}.${fuelTypes[fuelTypesKey]}.minmax.short_max`,
											{
												val: shortmax.toString(),
												ack: true,
												q: 0x40,
											},
										);

										await this.setStateAsync(
											`stations.${key}.${fuelTypes[fuelTypesKey]}.minmax.combined_max`,
											{
												val: `<span class="station_no_prices">${this.config.combinedOptions.noPrice}</span>`,
												ack: true,
											},
										);

										this.writeLog(
											`There is no ${fuelTypes[fuelTypesKey]} in the ${stationValue.stationname} ID: ${stationValue.station} station.`,
											'debug',
										);
									}
								}
							}
						} else if (prices[stationValue.station].status === 'closed') {
							if (this.config.resetValues) {
								for (const fuelTypesKey in fuelTypes) {
									if (fuelTypes.hasOwnProperty(fuelTypesKey)) {
										await this.setStateAsync(
											`stations.${key}.${fuelTypes[fuelTypesKey]}.feed`,
											{
												val: 0,
												ack: true,
											},
										);

										await this.setStateAsync(
											`stations.${key}.${fuelTypes[fuelTypesKey]}.short`,
											{
												val: '0',
												ack: true,
											},
										);

										await this.setStateAsync(
											`stations.${key}.${fuelTypes[fuelTypesKey]}.combined`,
											{
												val: `<span class="station_closed">${this.config.combinedOptions.closed}</span>`,
												ack: true,
											},
										);
									}
								}
							} else {
								for (const fuelTypesKey in fuelTypes) {
									if (fuelTypes.hasOwnProperty(fuelTypesKey)) {
										await this.setStateAsync(
											`stations.${key}.${fuelTypes[fuelTypesKey]}.feed`,
											{
												val: await this.oldState(
													`stations.${key}.${fuelTypes[fuelTypesKey]}.feed`,
												),
												ack: true,
												q: 0x40,
											},
										);
										const short = await this.oldState(
											`stations.${key}.${fuelTypes[fuelTypesKey]}.short`,
										);

										await this.setStateAsync(
											`stations.${key}.${fuelTypes[fuelTypesKey]}.short`,
											{
												val: short.toString(),
												ack: true,
												q: 0x40,
											},
										);

										await this.setStateAsync(
											`stations.${key}.${fuelTypes[fuelTypesKey]}.combined`,
											{
												val: `<span class="station_closed">${this.config.combinedOptions.closed}</span>`,
												ack: true,
											},
										);
									}
								}
							}
							if (prices[stationValue.station].status === 'closed')
								this.writeLog(`${stationValue.stationname} is Closed`, `debug`);
						} else if (
							prices[stationValue.station].status === 'no prices' ||
							prices[stationValue.station].status === 'not found' ||
							prices[stationValue.station].status === 'no stations'
						) {
							for (const fuelTypesKey in fuelTypes) {
								if (fuelTypes.hasOwnProperty(fuelTypesKey)) {
									await this.setStateAsync(
										`stations.${key}.${fuelTypes[fuelTypesKey]}.feed`,
										{
											val: await this.oldState(
												`stations.${key}.${fuelTypes[fuelTypesKey]}.feed`,
											),
											ack: true,
											q: 0x40,
										},
									);

									const short = await this.oldState(
										`stations.${key}.${fuelTypes[fuelTypesKey]}.short`,
									);

									await this.setStateAsync(
										`stations.${key}.${fuelTypes[fuelTypesKey]}.short`,
										{
											val: short.toString(),
											ack: true,
											q: 0x40,
										},
									);

									await this.setStateAsync(
										`stations.${key}.${fuelTypes[fuelTypesKey]}.combined`,
										{
											val:
												prices[stationValue.station].status === 'closed'
													? `<span class="station_closed">${this.config.combinedOptions.closed}</span>`
													: prices[stationValue.station].status === 'no prices'
													? `<span class="station_no_prices">${this.config.combinedOptions.noPrice}</span>`
													: prices[stationValue.station].status === 'not found' ||
													  prices[stationValue.station].status === 'no stations'
													? `<span class="station_not_found">${this.config.combinedOptions.notFound}</span>`
													: null,
											ack: true,
											q: 0,
										},
									);

									await this.setStateAsync(
										`stations.${key}.${fuelTypes[fuelTypesKey]}.minmax.feed_min`,
										{
											val: await this.oldState(
												`stations.${key}.${fuelTypes[fuelTypesKey]}.minmax.feed_min`,
											),
											ack: true,
											q: 0x40,
										},
									);

									const shortmin = await this.oldState(
										`stations.${key}.${fuelTypes[fuelTypesKey]}.minmax.short_min`,
									);

									await this.setStateAsync(
										`stations.${key}.${fuelTypes[fuelTypesKey]}.minmax.short_min`,
										{
											val: shortmin.toString(),
											ack: true,
											q: 0x40,
										},
									);

									await this.setStateAsync(
										`stations.${key}.${fuelTypes[fuelTypesKey]}.minmax.combined_min`,
										{
											val:
												prices[stationValue.station].status === 'closed'
													? `<span class="station_closed">${this.config.combinedOptions.closed}</span>`
													: prices[stationValue.station].status === 'no prices'
													? `<span class="station_no_prices">${this.config.combinedOptions.noPrice}</span>`
													: prices[stationValue.station].status === 'not found' ||
													  prices[stationValue.station].status === 'no stations'
													? `<span class="station_not_found">${this.config.combinedOptions.notFound}</span>`
													: null,
											ack: true,
											q: 0,
										},
									);

									await this.setStateAsync(
										`stations.${key}.${fuelTypes[fuelTypesKey]}.minmax.feed_max`,
										{
											val: await this.oldState(
												`stations.${key}.${fuelTypes[fuelTypesKey]}.minmax.feed_max`,
											),
											ack: true,
											q: 0x40,
										},
									);

									const shortmax = await this.oldState(
										`stations.${key}.${fuelTypes[fuelTypesKey]}.minmax.short_max`,
									);

									await this.setStateAsync(
										`stations.${key}.${fuelTypes[fuelTypesKey]}.minmax.short_max`,
										{
											val: shortmax.toString(),
											ack: true,
											q: 0x40,
										},
									);

									await this.setStateAsync(
										`stations.${key}.${fuelTypes[fuelTypesKey]}.minmax.combined_max`,
										{
											val:
												prices[stationValue.station].status === 'closed'
													? `<span class="station_closed">${this.config.combinedOptions.closed}</span>`
													: prices[stationValue.station].status === 'no prices'
													? `<span class="station_no_prices">${this.config.combinedOptions.noPrice}</span>`
													: prices[stationValue.station].status === 'not found' ||
													  prices[stationValue.station].status === 'no stations'
													? `<span class="station_not_found">${this.config.combinedOptions.notFound}</span>`
													: null,
											ack: true,
											q: 0,
										},
									);
								}
							}

							if (prices[stationValue.station].status === 'no prices')
								this.writeLog(`there are no prices at ${stationValue.stationname}`, `warn`);

							if (
								prices[stationValue.station].status === 'not found' ||
								prices[stationValue.station].status === 'no stations'
							)
								this.writeLog(
									`station ${stationValue.stationname} with ID: ${stationValue.station} was not found`,
									`warn`,
								);
						}
					}
				}

				// create a JsonTable an write in a state
				const JsonTable = await this.createJsonTable(prices, station);
				await this.setStateAsync(`stations.jsonTable`, {
					val: JSON.stringify(JsonTable),
					ack: true,
				});
			}
		} catch (error) {
			this.writeLog(`writeState error: ${error} stack: ${error.stack}`, 'error');
		}
	}

	/**
	 * @description create a JsonTable vor visualisation
	 */
	private async createJsonTable(
		price: Result,
		station: ioBroker.Station[],
	): Promise<CreateJsonTable[] | undefined> {
		try {
			const jsonTable = [];
			for (const key in station) {
				if (station.hasOwnProperty(key)) {
					for (const [stationID, pricesValue] of Object.entries(price)) {
						if (station[key].station === stationID) {
							if (typeof pricesValue.e5 !== 'number') {
								pricesValue.e5 = await this.oldState(`stations.${key}.e5.feed`);
							}
							if (typeof pricesValue.e10 !== 'number') {
								pricesValue.e10 = await this.oldState(`stations.${key}.e10.feed`);
							}
							if (typeof pricesValue.diesel !== 'number') {
								pricesValue.diesel = await this.oldState(`stations.${key}.diesel.feed`);
							}

							if (pricesValue.status !== 'open') {
								pricesValue.e5 = await this.oldState(`stations.${key}.e5.feed`);
								pricesValue.e10 = await this.oldState(`stations.${key}.e10.feed`);
								pricesValue.diesel = await this.oldState(`stations.${key}.diesel.feed`);
							}

							const status =
								pricesValue.status === 'open'
									? 'open'
									: pricesValue.status === 'closed'
									? this.config.combinedOptions.closed
									: pricesValue.status === 'no prices'
									? this.config.combinedOptions.noPrice
									: pricesValue.status === 'not found' ||
									  pricesValue.status === 'no stations'
									? this.config.combinedOptions.notFound
									: '';

							jsonTable.push({
								station: station[key].stationname,
								status: status,
								e5: pricesValue.e5 as number,
								e10: pricesValue.e10 as number,
								diesel: pricesValue.diesel as number,
								discount: station[key].discounted
									? station[key].discountObj.discountType === 'percent'
										? `${station[key].discountObj.discount}%`
										: `${station[key].discountObj.discount}€`
									: '0',
							});
						}
					}
				}
			}
			return jsonTable;
		} catch (error) {
			this.writeLog(`createJsonTable error: ${error} stack: ${error.stack}`, 'error');
		}
	}

	/**
	 * @description This function is used to get the short prices and the 3rd decimal place.
	 */
	private async cutPrice(
		price: string | number | boolean | undefined,
	): Promise<{ priceshort: string; price3rd: number }> {
		try {
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
		} catch (error) {
			this.writeLog(`cutPrice error: ${error} stack: ${error.stack}`, 'error');
			return { priceshort: '0', price3rd: 0 };
		}
	}

	/**
	 * @description add Discount to price if discount is active
	 */
	private async addDiscount(
		price: string | number | boolean | undefined,
		discount: number,
		discountType: 'absolute' | 'percent',
	): Promise<number> {
		try {
			// check if price in number format
			if (price === undefined) {
				price = 0;
			}
			if (typeof price === 'string') {
				price = parseFloat(price);
			}
			if (typeof price === 'boolean') {
				price = 0;
			}

			if (discountType === 'percent') {
				this.writeLog(`discount in percent: ${discount}`, 'debug');
				const newPrice = (price * discount) / 100;
				this.writeLog(
					`return Price with discount ${price - parseFloat(newPrice.toFixed(2))}`,
					'debug',
				);
				return price - parseFloat(newPrice.toFixed(2));
			} else if (discountType === 'absolute') {
				this.writeLog(`discount in absolute: ${discount}`, 'debug');
				this.writeLog(`return Price with discount ${price - discount}`, 'debug');

				// return price with 3 decimal places as number
				return parseFloat(parseFloat(String(price - discount)).toFixed(3));
			}
			return price;
		} catch (error) {
			this.writeLog(`addDiscount error: ${error} stack: ${error.stack}`, 'error');
			return parseFloat(<string>price);
		}
	}

	/**
	 * @description Function to create all Folder and states for the stations
	 */
	private async createAllStates(stations: ioBroker.Station[]): Promise<void> {
		try {
			this.writeLog('all states are now created', 'debug');

			//  create all channel
			await this.setObjectNotExistsAsync('stations.cheapest', {
				type: 'channel',
				common: {
					name: 'Cheapests gas stations',
				},
				native: {},
			});

			// create the cheapest folder and states
			for (const fuelTypesKey in fuelTypes) {
				if (fuelTypes.hasOwnProperty(fuelTypesKey)) {
					await this.setObjectNotExistsAsync(`stations.cheapest.${fuelTypes[fuelTypesKey]}`, {
						type: 'channel',
						common: {
							name: `cheapest ${fuelTypes[fuelTypesKey].toUpperCase()}`,
						},
						native: {},
					});
				}
			}
			for (const statesObjKey in statesObj) {
				if (statesObj.hasOwnProperty(statesObjKey)) {
					for (const fuelTypesKey in fuelTypes) {
						if (fuelTypes.hasOwnProperty(fuelTypesKey)) {
							await this.setObjectNotExistsAsync(
								`stations.cheapest.${fuelTypes[fuelTypesKey]}.${statesObjKey}`,
								statesObj[statesObjKey],
							);

							for (const priceObjKey in priceObj) {
								if (priceObj.hasOwnProperty(priceObjKey)) {
									await this.setObjectNotExistsAsync(
										`stations.cheapest.${fuelTypes[fuelTypesKey]}.${priceObjKey}`,
										{
											...priceObj[priceObjKey],
											common: {
												...priceObj[priceObjKey].common,
												name: `cheapest ${fuelTypes[fuelTypesKey]} ${priceObjKey}`,
											},
										},
									);
								}
							}
						}
					}
				}
			}

			// create all other folder and states
			for (const stationKey in stations) {
				if (parseFloat(stationKey) <= 9) {
					if (stations.hasOwnProperty(stationKey)) {
						const station: { station: string; stationname: string } = stations[stationKey];
						await this.setObjectNotExistsAsync(`stations.${stationKey}`, {
							type: 'channel',
							common: {
								name:
									station.stationname !== ''
										? station.stationname
										: `station ${stationKey}`,
							},
							native: {},
						});

						let objects = null;
						objects = await this.getObjectAsync(`stations.${stationKey}`);
						if (objects !== null && objects !== undefined) {
							const { common } = objects;
							if (common.name !== station.stationname) {
								await this.extendObjectAsync(`stations.${stationKey}`, {
									type: 'channel',
									common: {
										name:
											station.stationname !== ''
												? station.stationname
												: `station ${stationKey}`,
									},
									native: {},
								});
							}
						}

						for (const fuelTypesKey in fuelTypes) {
							if (fuelTypes.hasOwnProperty(fuelTypesKey)) {
								await this.setObjectNotExistsAsync(
									`stations.${stationKey}.${fuelTypes[fuelTypesKey]}`,
									{
										type: 'channel',
										common: {
											name: fuelTypes[fuelTypesKey].toUpperCase(),
										},
										native: {},
									},
								);
							}
						}

						for (const statesObjKey in statesObj) {
							if (statesObj.hasOwnProperty(statesObjKey)) {
								await this.setObjectNotExistsAsync(
									`stations.${stationKey}.${statesObjKey}`,
									statesObj[statesObjKey],
								);
							}
						}

						for (const fuelTypesKey in fuelTypes) {
							for (const priceObjKey in priceObj) {
								if (priceObj.hasOwnProperty(priceObjKey)) {
									await this.setObjectNotExistsAsync(
										`stations.${stationKey}.${fuelTypes[fuelTypesKey]}.${priceObjKey}`,
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

							// Create min/max channel
							await this.setObjectNotExistsAsync(
								`stations.${stationKey}.${fuelTypes[fuelTypesKey]}.minmax`,
								{
									type: 'channel',
									common: {
										name: 'Daily Min/Max',
									},
									native: {},
								},
							);

							//Create min/max states
							for (const priceMinMaxObjKey in priceMinMaxObj) {
								if (priceMinMaxObj.hasOwnProperty(priceMinMaxObjKey)) {
									await this.setObjectNotExistsAsync(
										`stations.${stationKey}.${fuelTypes[fuelTypesKey]}.minmax.${priceMinMaxObjKey}`,
										{
											...priceMinMaxObj[priceMinMaxObjKey],
											common: {
												...priceMinMaxObj[priceMinMaxObjKey].common,
												name: `${fuelTypes[fuelTypesKey]} ${priceMinMaxObjKey}`,
											},
										},
									);
								}
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

			await this.setObjectNotExistsAsync(`stations.jsonTable`, {
				type: 'state',
				common: {
					name: 'JSON Table vor Visualization',
					desc: 'JsonTable vor vis with all prices for all stations',
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
	 * @description a function for log output
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
	 * @description Is called when adapter shuts down - callback has to be called under any circumstances!
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
	 * If you need to accept messages in your adapter, uncomment the following block and the corresponding line in the constructor.
	 * Some message was sent to this instance over message box. Used by email, pushover, text2speech, ...
	 * Using this method requires "common.messagebox" property to be set to true in io-package.json
	 */
	// private async onMessage(obj: ioBroker.Message): Promise<void> {
	// 	try {
	// 		if (typeof obj === 'object' && obj.message) {
	// 			if (obj.command === 'send') {
	// 				// e.g. send email or pushover or whatever
	// 				this.log.info('send command');
	//
	//
	// 				// Send response in callback if required
	// 				if (obj.callback) this.sendTo(obj.from, obj.command, 'Message received', obj.callback);
	// 			}
	// 		}
	// 	} catch (e) {
	// 		this.writeLog(`Error onMessage: ${e}`, 'error');
	// 	}
	// }

	/**
	 * @description Is called if a subscribed state changes
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
