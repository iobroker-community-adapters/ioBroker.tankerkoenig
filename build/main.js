var __create = Object.create;
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target, mod));
var utils = __toESM(require("@iobroker/adapter-core"));
var import_axios = __toESM(require("axios"));
var import_object_definition = require("./lib/object_definition");
let requestTimeout = null;
let refreshTimeout = null;
let refreshStatusTimeout = null;
let refreshStatus = false;
const optionNoLog = false;
let sync_milliseconds = 5 * 60 * 1e3;
const fuelTypes = ["e5", "e10", "diesel"];
class Tankerkoenig extends utils.Adapter {
  constructor(options = {}) {
    super(__spreadProps(__spreadValues({}, options), {
      name: "tankerkoenig"
    }));
    this.on("ready", this.onReady.bind(this));
    this.on("stateChange", this.onStateChange.bind(this));
    this.on("unload", this.onUnload.bind(this));
  }
  async onReady() {
    const adapterObj = await this.getForeignObjectAsync(`system.adapter.${this.namespace}`);
    if (adapterObj) {
      if (adapterObj.common.mode !== "daemon") {
        adapterObj.common.mode = "daemon";
        await this.setForeignObjectAsync(adapterObj._id, adapterObj);
      } else {
        this.log.debug("Adapter is already running in daemon mode");
      }
    }
    sync_milliseconds = typeof this.config.synctime === "number" ? this.config.synctime * 1e3 * 60 : parseInt(this.config.synctime, 10) * 1e3 * 60;
    if (isNaN(sync_milliseconds) || sync_milliseconds < 5 * 60 * 1e3) {
      sync_milliseconds = 3e5;
      this.log.warn(`Sync time was too short (${this.config.synctime}). New sync time is 5 min`);
    }
    this.log.info(`Sync time set to ${this.config.synctime} minutes or ${sync_milliseconds} ms`);
    sync_milliseconds += Math.floor(Math.random() * 100);
    if (this.config.apikey.length === 36) {
      if (this.config.station.length > 0) {
        await this.createAllStates(this.config.station);
        await this.requestData();
      } else {
        this.writeLog(`No stations defined`, "error");
      }
    } else {
      this.writeLog(`No Api Key is specified`, "error");
    }
  }
  async requestData() {
    try {
      if (requestTimeout)
        clearTimeout(requestTimeout);
      this.writeLog(`request start now`, "debug");
      const url = `https://creativecommons.tankerkoenig.de/json/prices.php?ids=${this.config.station.map((station) => station.station).join(",")}&apikey=${this.config.apikey}`;
      await import_axios.default.get(url, {
        headers: { "User-Agent": `${this.name} ${this.version}` }
      }).then(async (response) => {
        if (response.status === 200) {
          this.writeLog(`type response: ${typeof response.data} >>> ${JSON.stringify(response.data)}`, "debug");
          if (response.data.ok) {
            await this.setStateAsync("stations.json", {
              val: JSON.stringify(response.data),
              ack: true
            });
            await this.writeState(response.data.prices);
            if (refreshStatusTimeout)
              clearTimeout(refreshStatusTimeout);
            refreshStatusTimeout = setTimeout(async () => {
              await this.setStateAsync(`stations.adapterStatus`, {
                val: "idle",
                ack: true
              });
            }, 2e3);
          }
        }
      }).catch(async (error) => {
        this.writeLog("Read in fuel prices (targeted stations via ID) - Error: " + error, "error");
        await this.setStateAsync(`stations.adapterStatus`, {
          val: "request Error",
          ack: true
        });
      });
      await this.setStateAsync(`stations.lastUpdate`, { val: Date.now(), ack: true });
      this.writeLog(`last update: ${new Date().toString()}`, "debug");
      requestTimeout = setTimeout(async () => {
        this.writeLog(`request timeout start new request`, "debug");
        await this.setStateAsync(`stations.adapterStatus`, {
          val: "automatic request",
          ack: true
        });
        await this.requestData();
      }, sync_milliseconds);
    } catch (error) {
      this.writeLog(`requestData error: ${error} stack: ${error.stack}`, "error");
    }
  }
  async writeState(prices) {
    try {
      const station = this.config.station;
      const cheapest_e5 = [];
      const cheapest_e10 = [];
      const cheapest_diesel = [];
      for (const stationValue of station) {
        for (const [stationID, pricesValue] of Object.entries(prices)) {
          if (stationID === stationValue.station) {
            if (stationValue.discounted) {
              stationValue.discountObj.fuelType.map(async (fuelType) => {
                for (const [key, priceValue] of Object.entries(pricesValue)) {
                  if (fuelType === key) {
                    if (stationValue.discountObj.discountType === "absolute") {
                      pricesValue[fuelType] = await this.addDiscount(priceValue, stationValue.discountObj.discount, stationValue.discountObj.discountType);
                    } else if (stationValue.discountObj.discountType === "percent") {
                      pricesValue[fuelType] = await this.addDiscount(priceValue, stationValue.discountObj.discount, stationValue.discountObj.discountType);
                    }
                  }
                }
              });
            }
          }
        }
      }
      await this.setStateAsync(`stations.adapterStatus`, {
        val: "write states",
        ack: true
      });
      if (this.config.resetValues) {
        this.writeLog(`reset all values`, "debug");
        for (const fuelTypesKey in fuelTypes) {
          if (fuelTypes.hasOwnProperty(fuelTypesKey)) {
            await this.setStateAsync(`stations.cheapest.${fuelTypes[fuelTypesKey]}.feed`, {
              val: 0,
              ack: true
            });
            await this.setStateAsync(`stations.cheapest.${fuelTypes[fuelTypesKey]}.short`, {
              val: "",
              ack: true
            });
            await this.setStateAsync(`stations.cheapest.${fuelTypes[fuelTypesKey]}.3rd`, {
              val: 0,
              ack: true
            });
            await this.setStateAsync(`stations.cheapest.${fuelTypes[fuelTypesKey]}.combined`, {
              val: "",
              ack: true
            });
            await this.setStateAsync(`stations.cheapest.${fuelTypes[fuelTypesKey]}.name`, {
              val: "",
              ack: true
            });
            await this.setStateAsync(`stations.cheapest.${fuelTypes[fuelTypesKey]}.status`, {
              val: "",
              ack: true
            });
            await this.setStateAsync(`stations.cheapest.${fuelTypes[fuelTypesKey]}.station_id`, {
              val: "",
              ack: true
            });
          }
        }
        for (const stationKey in station) {
          if (station.hasOwnProperty(stationKey)) {
            for (const fuelTypesKey in fuelTypes) {
              if (fuelTypes.hasOwnProperty(fuelTypesKey)) {
                await this.setStateAsync(`stations.${stationKey}.${fuelTypes[fuelTypesKey]}.feed`, {
                  val: 0,
                  ack: true
                });
                await this.setStateAsync(`stations.${stationKey}.${fuelTypes[fuelTypesKey]}.short`, {
                  val: "",
                  ack: true
                });
                await this.setStateAsync(`stations.${stationKey}.${fuelTypes[fuelTypesKey]}.3rd`, {
                  val: 0,
                  ack: true
                });
                await this.setStateAsync(`stations.${stationKey}.${fuelTypes[fuelTypesKey]}.combined`, {
                  val: "",
                  ack: true
                });
                await this.setStateAsync(`stations.${stationKey}.name`, {
                  val: "",
                  ack: true
                });
                await this.setStateAsync(`stations.${stationKey}.status`, {
                  val: "",
                  ack: true
                });
                await this.setStateAsync(`stations.${stationKey}.station_id`, {
                  val: "",
                  ack: true
                });
              }
            }
          }
        }
      }
      if (station.length !== 1) {
        this.writeLog(` find cheapest station for e5 / e10 / diesel`, "debug");
        for (const [stationID, pricesValue] of Object.entries(prices)) {
          if (typeof pricesValue.e5 !== "undefined") {
            if (pricesValue.e5) {
              cheapest_e5.push(__spreadProps(__spreadValues({}, pricesValue), { station: stationID }));
              cheapest_e5.sort((a, b) => {
                return a.e5 - b.e5;
              });
            }
          }
          if (typeof pricesValue.e10 !== "undefined") {
            if (pricesValue.e10) {
              cheapest_e10.push(__spreadProps(__spreadValues({}, pricesValue), { station: stationID }));
              cheapest_e10.sort((a, b) => {
                return a.e10 - b.e10;
              });
            }
          }
          if (typeof pricesValue.diesel !== "undefined") {
            if (pricesValue.diesel) {
              cheapest_diesel.push(__spreadProps(__spreadValues({}, pricesValue), { station: stationID }));
              cheapest_diesel.sort((a, b) => {
                return a.diesel - b.diesel;
              });
            }
          }
        }
      } else {
        this.writeLog(`only one station configured`, "debug");
        for (const [stationID, pricesValue] of Object.entries(prices)) {
          cheapest_e5.push(__spreadProps(__spreadValues({}, pricesValue), { station: stationID }));
          cheapest_e10.push(__spreadProps(__spreadValues({}, pricesValue), { station: stationID }));
          cheapest_diesel.push(__spreadProps(__spreadValues({}, pricesValue), { station: stationID }));
        }
      }
      for (const [key, stationValue] of Object.entries(station)) {
        if (stationValue.station === cheapest_e5[0].station) {
          this.writeLog(`write the cheapest e5 to the states`, "debug");
          await this.setStateAsync(`stations.cheapest.e5.feed`, {
            val: parseFloat(cheapest_e5[0].e5),
            ack: true
          });
          await this.setStateAsync(`stations.cheapest.e5.station_id`, {
            val: cheapest_e5[0].station,
            ack: true
          });
          await this.setStateAsync(`stations.cheapest.e5.name`, {
            val: stationValue.stationname,
            ack: true
          });
          await this.setStateAsync(`stations.cheapest.e5.status`, {
            val: cheapest_e5[0].status,
            ack: true
          });
          await this.setStateAsync(`stations.cheapest.e5.discounted`, {
            val: stationValue.discounted,
            ack: true
          });
          await this.setStateAsync(`stations.cheapest.e5.discount`, {
            val: stationValue.discountObj.discount,
            ack: true
          });
          const cutPrice = await this.cutPrice(cheapest_e5[0].e5);
          await this.setStateAsync(`stations.cheapest.e5.3rd`, {
            val: cutPrice.price3rd,
            ack: true
          });
          await this.setStateAsync(`stations.cheapest.e5.short`, {
            val: cutPrice.priceshort,
            ack: true
          });
          const combined = `<span class="station_open">${cutPrice.priceshort}<sup style="font-size: 50%">${cutPrice.price3rd}</sup> <span class="station_combined_euro">\u20AC</span></span>`;
          await this.setStateAsync(`stations.cheapest.e5.combined`, {
            val: combined,
            ack: true
          });
          this.writeLog(`Cheapest gas station for e5: ${stationValue.stationname}  id: ${cheapest_e5[0].station}`, "debug");
        }
        if (stationValue.station === cheapest_e10[0].station) {
          this.writeLog(`write the cheapest e10 to the states`, "debug");
          await this.setStateAsync(`stations.cheapest.e10.feed`, {
            val: parseFloat(cheapest_e10[0].e10),
            ack: true
          });
          await this.setStateAsync(`stations.cheapest.e10.station_id`, {
            val: cheapest_e10[0].station,
            ack: true
          });
          await this.setStateAsync(`stations.cheapest.e10.name`, {
            val: stationValue.stationname,
            ack: true
          });
          await this.setStateAsync(`stations.cheapest.e10.status`, {
            val: cheapest_e10[0].status,
            ack: true
          });
          await this.setStateAsync(`stations.cheapest.e10.discounted`, {
            val: stationValue.discounted,
            ack: true
          });
          await this.setStateAsync(`stations.cheapest.e10.discount`, {
            val: stationValue.discountObj.discount,
            ack: true
          });
          const cutPrice = await this.cutPrice(cheapest_e10[0].e10);
          await this.setStateAsync(`stations.cheapest.e10.3rd`, {
            val: cutPrice.price3rd,
            ack: true
          });
          await this.setStateAsync(`stations.cheapest.e10.short`, {
            val: cutPrice.priceshort,
            ack: true
          });
          const combined = `<span class="station_open">${cutPrice.priceshort}<sup style="font-size: 50%">${cutPrice.price3rd}</sup> <span class="station_combined_euro">\u20AC</span></span>`;
          await this.setStateAsync(`stations.cheapest.e10.combined`, {
            val: combined,
            ack: true
          });
          this.writeLog(`Cheapest gas station for e10: ${stationValue.stationname}  id: ${cheapest_e10[0].station}`, "debug");
        }
        if (stationValue.station === cheapest_diesel[0].station) {
          this.writeLog(`write the cheapest diesel to the states`, "debug");
          await this.setStateAsync(`stations.cheapest.diesel.feed`, {
            val: parseFloat(cheapest_diesel[0].diesel),
            ack: true
          });
          await this.setStateAsync(`stations.cheapest.diesel.station_id`, {
            val: cheapest_diesel[0].station,
            ack: true
          });
          await this.setStateAsync(`stations.cheapest.diesel.name`, {
            val: stationValue.stationname,
            ack: true
          });
          await this.setStateAsync(`stations.cheapest.diesel.status`, {
            val: cheapest_diesel[0].status,
            ack: true
          });
          await this.setStateAsync(`stations.cheapest.diesel.discounted`, {
            val: stationValue.discounted,
            ack: true
          });
          await this.setStateAsync(`stations.cheapest.diesel.discount`, {
            val: stationValue.discountObj.discount,
            ack: true
          });
          const cutPrice = await this.cutPrice(cheapest_diesel[0].diesel);
          await this.setStateAsync(`stations.cheapest.diesel.3rd`, {
            val: cutPrice.price3rd,
            ack: true
          });
          await this.setStateAsync(`stations.cheapest.diesel.short`, {
            val: cutPrice.priceshort,
            ack: true
          });
          const combined = `<span class="station_open">${cutPrice.priceshort}<sup style="font-size: 50%">${cutPrice.price3rd}</sup> <span class="station_combined_euro">\u20AC</span></span>`;
          await this.setStateAsync(`stations.cheapest.diesel.combined`, {
            val: combined,
            ack: true
          });
          this.writeLog(`Cheapest gas station for diesel: ${stationValue.stationname}  id: ${cheapest_diesel[0].station}`, "debug");
        }
        for (const [pricesKey] of Object.entries(prices)) {
          if (stationValue.station === pricesKey) {
            await this.setStateAsync(`stations.${key}.name`, {
              val: stationValue.stationname,
              ack: true
            });
            await this.setStateAsync(`stations.${key}.station_id`, {
              val: stationValue.station,
              ack: true
            });
            await this.setStateAsync(`stations.${key}.status`, {
              val: prices[stationValue.station].status,
              ack: true
            });
            await this.setStateAsync(`stations.${key}.discounted`, {
              val: stationValue.discounted,
              ack: true
            });
            await this.setStateAsync(`stations.${key}.discount`, {
              val: stationValue.discountObj.discount,
              ack: true
            });
            if (prices[stationValue.station].status === "open") {
              for (const fuelTypesKey in fuelTypes) {
                if (fuelTypes.hasOwnProperty(key)) {
                  if (prices[stationValue.station][fuelTypes[fuelTypesKey]]) {
                    await this.setStateAsync(`stations.${key}.${fuelTypes[fuelTypesKey]}.feed`, {
                      val: parseFloat(prices[stationValue.station][fuelTypes[fuelTypesKey]]),
                      ack: true
                    });
                    const pricesObj = await this.cutPrice(prices[stationValue.station][fuelTypes[fuelTypesKey]]);
                    await this.setStateAsync(`stations.${key}.${fuelTypes[fuelTypesKey]}.3rd`, {
                      val: pricesObj.price3rd,
                      ack: true
                    });
                    await this.setStateAsync(`stations.${key}.${fuelTypes[fuelTypesKey]}.short`, {
                      val: pricesObj.priceshort,
                      ack: true
                    });
                    const combined = `<span class="station_open">${pricesObj.priceshort}<sup style="font-size: 50%">${pricesObj.price3rd}</sup> <span class="station_combined_euro">\u20AC</span></span>`;
                    await this.setStateAsync(`stations.${key}.${fuelTypes[fuelTypesKey]}.combined`, {
                      val: combined,
                      ack: true
                    });
                  } else {
                    this.writeLog(`There is no ${key} in the ${stationValue.stationname} ID: ${stationValue.station} station.`, "debug");
                  }
                }
              }
            } else if (prices[stationValue.station].status === "closed") {
              for (const key2 in fuelTypes) {
                if (fuelTypes.hasOwnProperty(key2)) {
                  await this.setStateAsync(`stations.${key2}.${fuelTypes[key2]}.combined`, {
                    val: `<span class="station_closed">Station Closed</span>`,
                    ack: true
                  });
                }
              }
              this.writeLog(`${stationValue.stationname} is Closed`, `debug`);
            } else if (prices[stationValue.station].status === "no prices") {
              for (const key2 in fuelTypes) {
                if (fuelTypes.hasOwnProperty(key2)) {
                  await this.setStateAsync(`stations.${key2}.${fuelTypes[key2]}.combined`, {
                    val: `<span class="station_no_prices">No Prices</span>`,
                    ack: true
                  });
                }
              }
              this.writeLog(`there are no prices at ${stationValue.stationname}`, `warn`);
            } else if (prices[stationValue.station].status === "not found" || prices[stationValue.station].status === "no stations") {
              for (const key2 in fuelTypes) {
                if (fuelTypes.hasOwnProperty(key2)) {
                  await this.setStateAsync(`stations.${key2}.${fuelTypes[key2]}.combined`, {
                    val: `<span class="station_notfound">not found</span>`,
                    ack: true
                  });
                }
              }
              this.writeLog(`station ${stationValue.stationname} with ID: ${stationValue.station} was not found`, `warn`);
            }
          }
        }
      }
    } catch (error) {
      this.writeLog(`writeState error: ${error} stack: ${error.stack}`, "error");
    }
  }
  async cutPrice(price) {
    try {
      this.writeLog(`cutPrice: ${price} price type ${typeof price}`, "debug");
      if (price === void 0) {
        return { priceshort: "0", price3rd: 0 };
      }
      if (typeof price === "string") {
        price = parseFloat(price);
      }
      if (typeof price === "boolean") {
        price = 0;
      }
      this.writeLog(`price: ${price}`, "debug");
      price = price.toFixed(3);
      this.writeLog(` price.toFixed(3): ${price}`, "debug");
      const priceshort = price.slice(0, price.length - 1);
      this.writeLog(` priceshort: ${priceshort}`, "debug");
      const price3rd = parseInt(price.slice(-1));
      this.writeLog(` price3rd: ${price3rd}`, "debug");
      return {
        priceshort,
        price3rd
      };
    } catch (error) {
      this.writeLog(`cutPrice error: ${error} stack: ${error.stack}`, "error");
      return { priceshort: "0", price3rd: 0 };
    }
  }
  async addDiscount(price, discount, discountType) {
    try {
      if (price === void 0) {
        price = 0;
      }
      if (typeof price === "string") {
        price = parseFloat(price);
      }
      if (typeof price === "boolean") {
        price = 0;
      }
      if (discountType === "percent") {
        this.writeLog(`discount in percent: ${discount}`, "debug");
        const newPrice = price * discount / 100;
        this.writeLog(`return Price with discount ${price - parseFloat(newPrice.toFixed(2))}`, "debug");
        return price - parseFloat(newPrice.toFixed(2));
      } else if (discountType === "absolute") {
        this.writeLog(`discount in absolute: ${discount}`, "debug");
        this.writeLog(`return Price with discount ${price - discount}`, "debug");
        return price - discount;
      }
      return price;
    } catch (error) {
      this.writeLog(`addDiscount error: ${error} stack: ${error.stack}`, "error");
      return parseFloat(price);
    }
  }
  async createAllStates(stations) {
    try {
      this.writeLog("all states are now created", "debug");
      await this.setObjectNotExistsAsync("stations", {
        type: "channel",
        common: {
          name: "Gas stations"
        },
        native: {}
      });
      await this.setObjectNotExistsAsync("stations.cheapest", {
        type: "channel",
        common: {
          name: "Cheapests gas stations"
        },
        native: {}
      });
      for (const fuelTypesKey in fuelTypes) {
        if (fuelTypes.hasOwnProperty(fuelTypesKey)) {
          await this.setObjectNotExistsAsync(`stations.cheapest.${fuelTypes[fuelTypesKey]}`, {
            type: "channel",
            common: {
              name: `cheapest ${fuelTypes[fuelTypesKey].toUpperCase()}`
            },
            native: {}
          });
        }
      }
      for (const statesObjKey in import_object_definition.statesObj) {
        if (import_object_definition.statesObj.hasOwnProperty(statesObjKey)) {
          for (const fuelTypesKey in fuelTypes) {
            if (fuelTypes.hasOwnProperty(fuelTypesKey)) {
              await this.setObjectNotExistsAsync(`stations.cheapest.${fuelTypes[fuelTypesKey]}.${statesObjKey}`, import_object_definition.statesObj[statesObjKey]);
              for (const priceObjKey in import_object_definition.priceObj) {
                if (import_object_definition.priceObj.hasOwnProperty(priceObjKey)) {
                  await this.setObjectNotExistsAsync(`stations.cheapest.${fuelTypes[fuelTypesKey]}.${priceObjKey}`, __spreadProps(__spreadValues({}, import_object_definition.priceObj[priceObjKey]), {
                    common: __spreadProps(__spreadValues({}, import_object_definition.priceObj[priceObjKey].common), {
                      name: `cheapest ${fuelTypes[fuelTypesKey]} ${priceObjKey}`
                    })
                  }));
                }
              }
            }
          }
        }
      }
      for (const stationKey in stations) {
        if (parseFloat(stationKey) <= 9) {
          if (stations.hasOwnProperty(stationKey)) {
            const station = stations[stationKey];
            await this.setObjectNotExistsAsync(`stations.${stationKey}`, {
              type: "channel",
              common: {
                name: station.stationname
              },
              native: {}
            });
            let objects = null;
            objects = await this.getObjectAsync(`stations.${stationKey}`);
            if (objects !== null && objects !== void 0) {
              const { common } = objects;
              if (common.name !== station.stationname) {
                await this.extendObjectAsync(`stations.${stationKey}`, {
                  type: "channel",
                  common: {
                    name: station.stationname
                  },
                  native: {}
                });
              }
            }
            for (const fuelTypesKey in fuelTypes) {
              if (fuelTypes.hasOwnProperty(fuelTypesKey)) {
                await this.setObjectNotExistsAsync(`stations.${stationKey}.${fuelTypes[fuelTypesKey]}`, {
                  type: "channel",
                  common: {
                    name: fuelTypes[fuelTypesKey].toUpperCase()
                  },
                  native: {}
                });
              }
            }
            for (const statesObjKey in import_object_definition.statesObj) {
              if (import_object_definition.statesObj.hasOwnProperty(statesObjKey)) {
                await this.setObjectNotExistsAsync(`stations.${stationKey}.${statesObjKey}`, import_object_definition.statesObj[statesObjKey]);
              }
            }
            for (const fuelTypesKey in fuelTypes) {
              for (const priceObjKey in import_object_definition.priceObj) {
                if (import_object_definition.priceObj.hasOwnProperty(priceObjKey)) {
                  await this.setObjectNotExistsAsync(`stations.${stationKey}.${fuelTypes[fuelTypesKey]}.${priceObjKey}`, __spreadProps(__spreadValues({}, import_object_definition.priceObj[priceObjKey]), {
                    common: __spreadProps(__spreadValues({}, import_object_definition.priceObj[priceObjKey].common), {
                      name: `${fuelTypes[fuelTypesKey]} ${priceObjKey}`
                    })
                  }));
                }
              }
            }
          }
        }
      }
      await this.setObjectNotExistsAsync(`stations.json`, {
        type: "state",
        common: {
          name: "tankerkoenig JSON",
          desc: "JSON return from tankerkoenig.de with all prices for all stations",
          type: `string`,
          role: `json`,
          def: "",
          read: true,
          write: false
        },
        native: {}
      });
      await this.setObjectNotExistsAsync(`stations.lastUpdate`, {
        type: "state",
        common: {
          name: "tankerkoenig last update",
          desc: "last update of tankerkoenig.de",
          type: `number`,
          role: `value.time`,
          def: 0,
          read: true,
          write: false
        },
        native: {}
      });
      await this.setObjectNotExistsAsync(`stations.adapterStatus`, {
        type: "state",
        common: {
          name: "adapter status",
          desc: "adapter status",
          type: `string`,
          role: `info.status`,
          def: "idle",
          read: true,
          write: false
        },
        native: {}
      });
      await this.setObjectNotExistsAsync(`stations.refresh`, {
        type: "state",
        common: {
          name: "manuel refresh the data from tankerkoenig.de",
          desc: "refresh the data from tankerkoenig.de",
          type: `boolean`,
          role: `button`,
          def: false,
          read: true,
          write: true
        },
        native: {}
      });
      await this.subscribeStates(`stations.refresh`);
    } catch (e) {
      this.writeLog(`Error creating all states: ${e}`, "error");
    }
  }
  writeLog(logtext, logtype) {
    try {
      if (!optionNoLog) {
        if (logtype === "silly")
          this.log.silly(logtext);
        if (logtype === "info")
          this.log.info(logtext);
        if (logtype === "debug")
          this.log.debug(logtext);
        if (logtype === "warn")
          this.log.warn(logtext);
        if (logtype === "error")
          this.log.error(logtext);
      } else {
        if (logtype === "error")
          this.log.error(logtext);
      }
    } catch (error) {
      this.log.error(`writeLog error: ${error} , stack: ${error.stack}`);
    }
  }
  async onUnload(callback) {
    try {
      if (requestTimeout)
        clearInterval(requestTimeout);
      if (refreshTimeout)
        clearInterval(refreshTimeout);
      if (refreshStatusTimeout)
        clearTimeout(refreshStatusTimeout);
      await this.setStateAsync(`stations.adapterStatus`, {
        val: "offline",
        ack: true
      });
      callback();
    } catch (e) {
      callback();
    }
  }
  async onStateChange(id, state) {
    try {
      if (state) {
        if (id === `${this.namespace}.stations.refresh`) {
          if (state.val && !state.ack) {
            if (!refreshTimeout) {
              this.writeLog(`refresh timeout set to 1min`, "info");
              refreshTimeout = setTimeout(async () => {
                this.writeLog(`refresh again possible`, "info");
                refreshTimeout = null;
                refreshStatus = false;
              }, 6e4);
            }
            if (!refreshStatus) {
              refreshStatus = true;
              this.writeLog("manuel refresh the data from tankerkoenig.de", "info");
              await this.setStateAsync(`stations.adapterStatus`, {
                val: "manuel request",
                ack: true
              });
              await this.requestData();
            } else {
              this.writeLog("too short time between manual refreshes, manual request is allowed only once per min.", "warn");
              await this.setStateAsync(`stations.adapterStatus`, {
                val: "request timeout 1min",
                ack: true
              });
              if (refreshStatusTimeout)
                clearTimeout(refreshStatusTimeout);
              refreshStatusTimeout = setTimeout(async () => {
                await this.setStateAsync(`stations.adapterStatus`, {
                  val: "idle",
                  ack: true
                });
              }, 5e3);
            }
          }
        }
      }
    } catch (e) {
      this.writeLog(`[onStateChane ${id}] error: ${e} , stack: ${e.stack}`, "error");
    }
  }
}
if (require.main !== module) {
  module.exports = (options) => new Tankerkoenig(options);
} else {
  (() => new Tankerkoenig())();
}
//# sourceMappingURL=main.js.map
