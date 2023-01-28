"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var utils = __toESM(require("@iobroker/adapter-core"));
var import_axios = __toESM(require("axios"));
var import_object_definition = require("./lib/object_definition");
const pattern = /[0-9|a-z]{8}\-[0-9|a-z]{4}\-[0-9|a-z]{4}\-[0-9|a-z]{4}\-[0-9|a-z]{12}/g;
class Tankerkoenig extends utils.Adapter {
  constructor(options = {}) {
    super({
      ...options,
      name: "tankerkoenig"
    });
    this.on("ready", this.onReady.bind(this));
    this.on("stateChange", this.onStateChange.bind(this));
    this.on("unload", this.onUnload.bind(this));
    this.on("message", this.onMessage.bind(this));
    this.startRequestTimeout = null;
    this.requestTimeout = null;
    this.refreshTimeout = null;
    this.refreshStatusTimeout = null;
    this.fuelTypes = ["e5", "e10", "diesel"];
    this.sync_milliseconds = 10 * 60 * 1e3;
    this.refreshStatus = false;
  }
  async onReady() {
    try {
      const adapterObj = await this.getForeignObjectAsync(
        `system.adapter.${this.namespace}`
      );
      if (adapterObj) {
        if (adapterObj.common.mode !== "daemon") {
          adapterObj.common.mode = "daemon";
          await this.setForeignObjectAsync(adapterObj._id, adapterObj);
        } else {
          this.writeLog("Adapter is already in daemon mode", "info");
        }
      }
      this.sync_milliseconds = typeof this.config.synctime === "number" ? this.config.synctime * 1e3 * 60 : parseInt(this.config.synctime, 10) * 1e3 * 60;
      if (isNaN(this.sync_milliseconds) || this.sync_milliseconds < 10 * 60 * 1e3) {
        this.sync_milliseconds = 10 * 60 * 1e3;
        this.writeLog(
          `Sync time was too short (${this.config.synctime}). New sync time is 10 min`,
          "warn"
        );
      }
      this.writeLog(
        `Sync time set to ${this.sync_milliseconds / 1e3 / 60} minutes or ${this.sync_milliseconds} ms`,
        "info"
      );
      if (this.config.apikey && this.config.apikey.match(pattern)) {
        this.writeLog("API key is not encrypted. Encrypting API key", "info");
        this.config.apikey = this.encrypt(this.config.apikey);
        const obj = await this.getForeignObjectAsync(`system.adapter.${this.namespace}`);
        if (obj) {
          obj.native.apikey = this.config.apikey;
          await this.setForeignObjectAsync(`system.adapter.${this.namespace}`, obj);
          this.writeLog("API key encrypted", "info");
        }
      }
      if (this.config.station) {
        for (const stations of this.config.station) {
          if (!stations.city) {
            this.writeLog(
              `City is missing in config from station ${stations.stationname}. Please check your configuration or reconfigure the stations => edit station => save`,
              "warn"
            );
            stations.city = "";
          } else {
            const cityType = typeof stations.city;
            if (cityType !== "string") {
              this.writeLog(
                `City type is ${cityType} in config from station ${stations.stationname} must be have type string. Please check your configuration or reconfigure the stations => edit station => save`,
                "warn"
              );
              stations.city = "";
            }
          }
          if (!stations.street) {
            this.writeLog(
              `Street is missing in config from station ${stations.stationname}. Please check your configuration or reconfigure the stations => edit station => save`,
              "warn"
            );
            stations.street = "";
          } else {
            const streetType = typeof stations.street;
            if (streetType !== "string") {
              this.writeLog(
                `Street type is ${streetType} in config from station ${stations.stationname} must be have type string. Please check your configuration or reconfigure the stations => edit station => save`,
                "warn"
              );
              stations.street = "";
            }
          }
          if (!stations.houseNumber) {
            this.writeLog(
              `House number is missing in config from station ${stations.stationname}. Please check your configuration or reconfigure the stations => edit station => save`,
              "warn"
            );
            stations.houseNumber = " ";
          } else {
            const houseNumberType = typeof stations.houseNumber;
            if (houseNumberType !== "string") {
              this.writeLog(
                `House number type is ${houseNumberType} in config from station ${stations.stationname} must be have type string. Please check your configuration or reconfigure the stations => edit station => save`,
                "warn"
              );
              stations.houseNumber = " ";
            }
          }
          if (!stations.postCode) {
            this.writeLog(
              `Post code is missing in config from station ${stations.stationname}. Please check your configuration or reconfigure the stations => edit station => save`,
              "warn"
            );
            stations.postCode = " ";
          } else {
            const postCodeType = typeof stations.postCode;
            if (postCodeType !== "string") {
              this.writeLog(
                `Post code type is ${postCodeType} in config from station ${stations.stationname} must be have type string. Please check your configuration or reconfigure the stations => edit station => save`,
                "warn"
              );
              stations.postCode = stations.postCode.toString();
            }
          }
          if (!stations.latitude) {
            this.writeLog(
              `Latitude is missing in config from station ${stations.stationname}. Please check your configuration or reconfigure the stations => edit station => save`,
              "warn"
            );
            stations.latitude = 0;
          } else {
            const latitudeType = typeof stations.latitude;
            if (latitudeType !== "number") {
              this.writeLog(
                `Latitude type is ${latitudeType} in config from station ${stations.stationname} must be have type number. Please check your configuration or reconfigure the stations => edit station => save`,
                "warn"
              );
              stations.latitude = 0;
            }
          }
          if (!stations.longitude) {
            this.writeLog(
              `Longitude is missing in config from station ${stations.stationname}. Please check your configuration or reconfigure the stations => edit station => save`,
              "warn"
            );
            stations.longitude = 0;
          } else {
            const longitudeType = typeof stations.longitude;
            if (longitudeType !== "number") {
              this.writeLog(
                `Longitude type is ${longitudeType} in config from station ${stations.stationname} must be have type number. Please check your configuration or reconfigure the stations => edit station => save`,
                "warn"
              );
              stations.longitude = 0;
            }
          }
          if (!stations.openingTimes) {
            this.writeLog(
              `Opening times is missing in config from station ${stations.stationname}. Please check your configuration or reconfigure the stations => edit station => save`,
              "warn"
            );
            stations.openingTimes = "no Data";
          } else {
            const openingTimesType = typeof stations.openingTimes;
            if (openingTimesType !== "object" && openingTimesType !== "string") {
              this.writeLog(
                `Opening times type is ${openingTimesType} in config from station ${stations.stationname} must be have type string. Please check your configuration or reconfigure the stations => edit station => save`,
                "warn"
              );
              stations.openingTimes = "no Data";
            }
          }
          if (!stations.overrides) {
            this.writeLog(
              `Overrides is missing in config from station ${stations.stationname}. Please check your configuration or reconfigure the stations => edit station => save`,
              "warn"
            );
            stations.overrides = "no Data";
          } else {
            const overridesType = typeof stations.overrides;
            if (overridesType !== "object" && overridesType !== "string") {
              this.writeLog(
                `Overrides type is ${overridesType} in config from station ${stations.stationname} must be have type object. Please check your configuration or reconfigure the stations => edit station => save`,
                "warn"
              );
              stations.overrides = "no Data";
            }
          }
        }
      }
      this.sync_milliseconds += Math.floor(Math.random() * 60) * 1e3;
      if (this.decrypt(this.config.apikey).length === 36) {
        if (this.config.station.length > 0) {
          if (this.startRequestTimeout)
            clearTimeout(this.startRequestTimeout);
          await this.createAllStates(this.config.station);
          this.startRequestTimeout = setTimeout(async () => {
            this.writeLog("Start first request", "info");
            await this.requestData();
          }, 1e3);
        } else {
          this.writeLog(`No stations defined`, "error");
        }
      } else {
        this.writeLog(`No Api Key is specified`, "error");
      }
    } catch (error) {
      this.writeLog(
        `[ Adapter V:${this.version} onReady ] error: ${error} stack: ${error.stack}`,
        "error"
      );
    }
  }
  async requestData() {
    try {
      if (this.requestTimeout)
        clearTimeout(this.requestTimeout);
      this.writeLog(`request start now}`, "debug");
      const url = `https://creativecommons.tankerkoenig.de/json/prices.php?ids=${this.config.station.map((station) => station.station).join(",")}&apikey=${this.decrypt(this.config.apikey)}`;
      this.writeLog(`request url: ${url}`, "debug");
      const config = {
        headers: {
          "User-Agent": `${this.name}/${this.version}`,
          Accept: "application/json"
        }
      };
      const response = await import_axios.default.get(url, config);
      console.log(
        `[ Adapter V:${this.version} requestData axios: ${import_axios.default.VERSION} ] response data:`,
        response
      );
      if (response.status === 200) {
        this.writeLog(
          `[ Adapter V:${this.version} requestData axios: ${import_axios.default.VERSION} ] response data: ${JSON.stringify(response.data)}`,
          "debug"
        );
        if (response.data.ok) {
          await this.setStateAsync("stations.json", {
            val: JSON.stringify(response.data),
            ack: true
          });
          const price = await this.setDiscount(response.data.prices);
          await this.writeState(price);
          if (this.refreshStatusTimeout)
            clearTimeout(this.refreshStatusTimeout);
          this.refreshStatusTimeout = setTimeout(async () => {
            await this.setStateAsync(`stations.adapterStatus`, {
              val: "idle",
              ack: true
            });
          }, 2e3);
        } else {
          this.writeLog(
            `[ Adapter V:${this.version} requestData  axios: ${import_axios.default.VERSION} ] response not ok`,
            "error"
          );
          this.writeLog(
            `[ Adapter V:${this.version} requestData  axios: ${import_axios.default.VERSION} ] response data: ${JSON.stringify(response.data)}`,
            "error"
          );
          if (response.data.message === "parameter error") {
            this.writeLog(
              `[ Adapter V:${this.version} requestData  axios: ${import_axios.default.VERSION} ] all parameters that have been sent: ${url}`,
              "error"
            );
          }
        }
      } else {
        this.writeLog(
          `[ Adapter V:${this.version} requestData  axios: ${import_axios.default.VERSION} ] response status code ${response.status} status text: ${response.statusText} data: ${JSON.stringify(response.data)}`,
          "error"
        );
      }
      await this.setStateAsync(`stations.lastUpdate`, { val: Date.now(), ack: true });
      this.writeLog(`last update: ${new Date().toString()}`, "debug");
      this.requestTimeout = setTimeout(async () => {
        this.writeLog(`request timeout start new request`, "debug");
        await this.setStateAsync(`stations.adapterStatus`, {
          val: "automatic request",
          ack: true
        });
        await this.requestData();
      }, this.sync_milliseconds);
    } catch (error) {
      if (error.response) {
        if (error.response.status === 503) {
          this.writeLog(
            `[ requestDetails axios: ${import_axios.default.VERSION} ] Code: ${error.response.status} Message: >> ${error.response.statusText} Rate Limit Exceeded << Data: ${JSON.stringify(error.response.data)}`,
            "error"
          );
        } else {
          this.writeLog(
            `[ Adapter V:${this.version} requestData axios: ${import_axios.default.VERSION} ] error.response: Code: ${error.response.status}  Message: ${error.response.statusText} Data: ${JSON.stringify(error.response.data)} `,
            "error"
          );
        }
      } else {
        this.writeLog(
          `[ Adapter V:${this.version} requestData axios: ${import_axios.default.VERSION} ] Error: ${error} Error Code ${error.code} Error Message ${error.message} >>> Stack: ${error.stack}`,
          "error"
        );
      }
      await this.setStateAsync(`stations.adapterStatus`, {
        val: "request Error",
        ack: true
      });
      this.requestTimeout = setTimeout(async () => {
        this.writeLog(`request timeout start new request`, "debug");
        await this.setStateAsync(`stations.adapterStatus`, {
          val: "automatic request",
          ack: true
        });
        await this.requestData();
      }, this.sync_milliseconds);
    }
  }
  async setDiscount(price) {
    try {
      const station = this.config.station;
      for (const stationValue of station) {
        for (const [stationID, pricesValue] of Object.entries(price)) {
          if (stationID === stationValue.station) {
            if (stationValue.discounted) {
              stationValue.discountObj.fuelType.map(async (fuelType) => {
                for (const [key, priceValue] of Object.entries(pricesValue)) {
                  if (fuelType === key) {
                    if (stationValue.discountObj.discountType === "absolute") {
                      pricesValue[fuelType] = await this.addDiscount(
                        priceValue,
                        stationValue.discountObj.discount,
                        stationValue.discountObj.discountType
                      );
                    } else if (stationValue.discountObj.discountType === "percent") {
                      pricesValue[fuelType] = await this.addDiscount(
                        priceValue,
                        stationValue.discountObj.discount,
                        stationValue.discountObj.discountType
                      );
                    }
                  }
                }
              });
            }
          }
        }
      }
      return price;
    } catch (error) {
      this.writeLog(
        `[ Adapter V:${this.version} setDiscount ] error: ${error} stack: ${error.stack}`,
        "error"
      );
      return price;
    }
  }
  async oldState(id) {
    try {
      const oldState = await this.getStateAsync(id);
      return oldState ? oldState.val : null;
    } catch (error) {
      this.writeLog(
        `[ Adapter V:${this.version} oldState ] error: ${error} stack: ${error.stack}`,
        "error"
      );
      return null;
    }
  }
  async dayState(id) {
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
      this.writeLog(
        `[ Adapter V:${this.version} dayState ] error: ${error} stack: ${error.stack}`,
        "error"
      );
      return null;
    }
  }
  async calcPriceDiff(id, diffID, newPrice) {
    try {
      const oldPrice = await this.oldState(id);
      if (oldPrice !== null) {
        const diff = parseFloat(newPrice) - parseFloat(oldPrice);
        const diffRound = Math.round(diff * 100) / 100;
        if (diffRound !== 0) {
          this.writeLog(
            `[ Adapter V:${this.version} calcPriceDiff ] oldPrice: ${oldPrice} newPrice: ${newPrice} diff: ${diffRound}`,
            "debug"
          );
          return diffRound;
        } else {
          const oldDiff = await this.oldState(diffID);
          if (oldDiff !== null) {
            this.writeLog(
              `[ Adapter V:${this.version} calcPriceDiff ] oldPrice: ${oldPrice} newPrice: ${newPrice} oldDiff: ${oldDiff}`,
              "debug"
            );
            return oldDiff;
          } else {
            this.writeLog(
              `[ Adapter V:${this.version} calcPriceDiff ] oldDiff: is null`,
              "debug"
            );
            return 0;
          }
        }
      } else {
        this.writeLog(`[ Adapter V:${this.version} calcPriceDiff ] oldPrice: is null`, "debug");
        return 0;
      }
    } catch (error) {
      this.writeLog(
        `[ Adapter V:${this.version} calcPriceDiff ] error for ID: ${id} error: ${error} stack: ${error.stack}`,
        "error"
      );
      return 0;
    }
  }
  async writeState(prices) {
    try {
      const station = this.config.station;
      let openStationsE5 = [];
      const cheapest_e5 = [];
      const cheapest_e10 = [];
      let openStationsE10 = [];
      const cheapest_diesel = [];
      let openStationsDiesel = [];
      await this.setStateAsync(`stations.adapterStatus`, {
        val: "write states",
        ack: true
      });
      const newPrices = {};
      for (const stationValue of station) {
        for (const [stationID, pricesValue] of Object.entries(prices)) {
          if (stationID === stationValue.station) {
            newPrices[stationID] = pricesValue;
          }
        }
      }
      if (station.length !== 1) {
        this.writeLog(` find cheapest station for e5 / e10 / diesel`, "debug");
        for (const [stationID, pricesValue] of Object.entries(newPrices)) {
          if (pricesValue.status === "open") {
            if (typeof pricesValue.e5 !== "undefined") {
              if (pricesValue.e5) {
                cheapest_e5.push({ ...pricesValue, station: stationID });
                openStationsE5 = cheapest_e5.filter((station2) => station2.status === "open");
                openStationsE5.sort((a, b) => a.e5 - b.e5);
              }
            }
            if (typeof pricesValue.e10 !== "undefined") {
              if (pricesValue.e10) {
                cheapest_e10.push({ ...pricesValue, station: stationID });
                openStationsE10 = cheapest_e10.filter((station2) => station2.status === "open");
                openStationsE10.sort((a, b) => a.e10 - b.e10);
              }
            }
            if (typeof pricesValue.diesel !== "undefined") {
              if (pricesValue.diesel) {
                cheapest_diesel.push({ ...pricesValue, station: stationID });
                openStationsDiesel = cheapest_diesel.filter(
                  (station2) => station2.status === "open"
                );
                openStationsDiesel.sort((a, b) => a.diesel - b.diesel);
              }
            }
          } else {
            this.writeLog(` station ${stationID} is closed`, "debug");
            if (typeof pricesValue.status !== "undefined") {
              cheapest_e5.push({ ...pricesValue, station: stationID });
            }
            if (typeof pricesValue.status !== "undefined") {
              cheapest_e10.push({ ...pricesValue, station: stationID });
            }
            if (typeof pricesValue.status !== "undefined") {
              cheapest_diesel.push({ ...pricesValue, station: stationID });
            }
          }
        }
      } else {
        this.writeLog(`only one station configured`, "debug");
        for (const [stationID, pricesValue] of Object.entries(prices)) {
          if (pricesValue.status === "open") {
            cheapest_e5.push({ ...pricesValue, station: stationID });
            cheapest_e10.push({ ...pricesValue, station: stationID });
            cheapest_diesel.push({ ...pricesValue, station: stationID });
          } else {
            this.writeLog(` station ${stationID} is closed`, "debug");
            if (typeof pricesValue.status !== "undefined") {
              cheapest_e5.push({ ...pricesValue, station: stationID });
            }
            if (typeof pricesValue.status !== "undefined") {
              cheapest_e10.push({ ...pricesValue, station: stationID });
            }
            if (typeof pricesValue.status !== "undefined") {
              cheapest_diesel.push({ ...pricesValue, station: stationID });
            }
          }
        }
      }
      const newE5 = openStationsE5.length > 0 ? openStationsE5 : cheapest_e5;
      const newE10 = openStationsE10.length > 0 ? openStationsE10 : cheapest_e10;
      const newDiesel = openStationsDiesel.length > 0 ? openStationsDiesel : cheapest_diesel;
      const allCheapestE5 = [];
      const allCheapestE10 = [];
      const allCheapestDiesel = [];
      const filterE5 = newE5.filter((station2) => station2.e5 === newE5[0].e5);
      this.writeLog(` filterE5 ${JSON.stringify(filterE5)}`, "debug");
      const filterE10 = newE10.filter((station2) => station2.e10 === newE10[0].e10);
      this.writeLog(` filterE10 ${JSON.stringify(filterE10)}`, "debug");
      const filterDiesel = newDiesel.filter((station2) => station2.diesel === newDiesel[0].diesel);
      this.writeLog(` filterDiesel ${JSON.stringify(filterDiesel)}`, "debug");
      const cheapestE5State = [];
      const cheapestE10State = [];
      const cheapestDieselState = [];
      for (const filterE5Key in filterE5) {
        if (filterE5.hasOwnProperty(filterE5Key)) {
          for (const stationKey in station) {
            if (station.hasOwnProperty(stationKey)) {
              if (filterE5[filterE5Key].station === station[stationKey].station) {
                allCheapestE5.push({ name: station[stationKey].stationname });
                cheapestE5State.push({ index: stationKey, id: station[stationKey].station });
              }
            }
          }
        }
      }
      this.writeLog(`cheapestE5State ${JSON.stringify(cheapestE5State)}`, "debug");
      for (const stationKey in station) {
        if (station.hasOwnProperty(stationKey)) {
          let found = false;
          for (const cheapestE5StateKey in cheapestE5State) {
            if (cheapestE5State.hasOwnProperty(cheapestE5StateKey)) {
              if (cheapestE5State[cheapestE5StateKey].index === stationKey) {
                found = true;
                await this.setStateAsync(`stations.${stationKey}.e5.cheapest`, {
                  val: true,
                  ack: true
                });
              }
            }
          }
          if (!found) {
            await this.setStateAsync(`stations.${stationKey}.e5.cheapest`, {
              val: false,
              ack: true
            });
          }
        }
      }
      this.writeLog(`allCheapestE5: ${JSON.stringify(allCheapestE5)}`, "debug");
      for (const filterE10Key in filterE10) {
        if (filterE10.hasOwnProperty(filterE10Key)) {
          for (const stationKey in station) {
            if (station.hasOwnProperty(stationKey)) {
              if (filterE10[filterE10Key].station === station[stationKey].station) {
                allCheapestE10.push({ name: station[stationKey].stationname });
                cheapestE10State.push({ index: stationKey, id: station[stationKey].station });
              }
            }
          }
        }
      }
      this.writeLog(` cheapestE10State ${JSON.stringify(cheapestE10State)}`, "debug");
      for (const stationKey in station) {
        if (station.hasOwnProperty(stationKey)) {
          let found = false;
          for (const cheapestE10StateKey in cheapestE10State) {
            if (cheapestE10State.hasOwnProperty(cheapestE10StateKey)) {
              if (cheapestE10State[cheapestE10StateKey].index === stationKey) {
                found = true;
                await this.setStateAsync(`stations.${stationKey}.e10.cheapest`, {
                  val: true,
                  ack: true
                });
              }
            }
          }
          if (!found) {
            await this.setStateAsync(`stations.${stationKey}.e10.cheapest`, {
              val: false,
              ack: true
            });
          }
        }
      }
      this.writeLog(`allCheapestE10: ${JSON.stringify(allCheapestE10)}`, "debug");
      for (const filterDieselKey in filterDiesel) {
        if (filterDiesel.hasOwnProperty(filterDieselKey)) {
          for (const stationKey in station) {
            if (station.hasOwnProperty(stationKey)) {
              if (filterDiesel[filterDieselKey].station === station[stationKey].station) {
                allCheapestDiesel.push({ name: station[stationKey].stationname });
                cheapestDieselState.push({
                  index: stationKey,
                  id: station[stationKey].station
                });
              }
            }
          }
        }
      }
      this.writeLog(` cheapestDieselState ${JSON.stringify(cheapestDieselState)}`, "debug");
      for (const stationKey in station) {
        if (station.hasOwnProperty(stationKey)) {
          let found = false;
          for (const cheapestDieselStateKey in cheapestDieselState) {
            if (cheapestDieselState.hasOwnProperty(cheapestDieselStateKey)) {
              if (cheapestDieselState[cheapestDieselStateKey].index === stationKey) {
                found = true;
                await this.setStateAsync(`stations.${stationKey}.diesel.cheapest`, {
                  val: true,
                  ack: true
                });
              }
            }
          }
          if (!found) {
            await this.setStateAsync(`stations.${stationKey}.diesel.cheapest`, {
              val: false,
              ack: true
            });
          }
        }
      }
      this.writeLog(`allCheapestDiesel: ${JSON.stringify(allCheapestDiesel)}`, "debug");
      for (const [key, stationValue] of Object.entries(station)) {
        if (stationValue.postCode) {
          const postCode = stationValue.postCode;
          if (typeof postCode !== "string") {
            this.writeLog(
              `postCode for station ${stationValue.station} name ${stationValue.stationname} is a number => set to string`,
              "debug"
            );
            console.log(
              `postCode for station ${stationValue.station} name ${stationValue.stationname} is a number => set to string`
            );
            stationValue.postCode = postCode.toString();
          } else {
            this.writeLog(
              `postCode for station ${stationValue.station} name ${stationValue.stationname} is a string`,
              "debug"
            );
          }
        } else {
          this.writeLog(
            `postCode for station ${stationValue.station} name ${stationValue.stationname} is not defined`,
            "debug"
          );
          stationValue.postCode = "";
        }
        this.writeLog(
          ` cheapest e5: ${newE5[0].e5} at ${newE5[0].station} array: ${JSON.stringify(newE5)}`,
          "debug"
        );
        this.writeLog(
          ` cheapest e10: ${newE10[0].e10} at ${newE10[0].station} array: ${JSON.stringify(
            newE10
          )}`,
          "debug"
        );
        this.writeLog(
          ` cheapest diesel: ${newDiesel[0].diesel} at ${newDiesel[0].station} array: ${JSON.stringify(newDiesel)}`,
          "debug"
        );
        if (stationValue.station === newE5[0].station) {
          this.writeLog(`write the cheapest e5 to the states`, "debug");
          if (newE5[0].status === "open") {
            await this.setStateAsync(`stations.cheapest.e5.feed`, {
              val: parseFloat(newE5[0].e5),
              ack: true
            });
            await this.setStateAsync(`stations.cheapest.e5.station_id`, {
              val: newE5[0].station,
              ack: true
            });
            await this.setStateAsync(`stations.cheapest.e5.name`, {
              val: stationValue.stationname,
              ack: true
            });
            await this.setStateAsync(`stations.cheapest.e5.status`, {
              val: newE5[0].status,
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
            const cutPrice = await this.cutPrice(newE5[0].e5);
            await this.setStateAsync(`stations.cheapest.e5.3rd`, {
              val: cutPrice.price3rd,
              ack: true
            });
            await this.setStateAsync(`stations.cheapest.e5.difference`, {
              val: await this.calcPriceDiff(
                `stations.cheapest.e5.short`,
                `stations.cheapest.e5.difference`,
                cutPrice.priceshort
              ),
              ack: true
            });
            await this.setStateAsync(`stations.cheapest.e5.short`, {
              val: cutPrice.priceshort,
              ack: true
            });
            await this.setStateAsync(`stations.cheapest.e5.cheapest_stations`, {
              val: JSON.stringify(allCheapestE5),
              ack: true
            });
            const combined = `<span class="station_open">${cutPrice.priceshort}<sup style="font-size: 50%">${cutPrice.price3rd}</sup> <span class="station_combined_euro">\u20AC</span></span>`;
            await this.setStateAsync(`stations.cheapest.e5.combined`, {
              val: combined,
              ack: true
            });
            this.writeLog(
              `Cheapest gas station for e5: ${stationValue.stationname}  id: ${newE5[0].station}`,
              "debug"
            );
          } else {
            await this.setStateAsync(`stations.cheapest.e5.feed`, {
              val: await this.oldState(`stations.cheapest.e5.feed`),
              ack: true,
              q: 64
            });
            const short = await this.oldState(`stations.cheapest.e5.short`);
            await this.setStateAsync(`stations.cheapest.e5.short`, {
              val: short.toString(),
              ack: true,
              q: 64
            });
            await this.setStateAsync(`stations.cheapest.e5.combined`, {
              val: prices[stationValue.station].status === "closed" ? `<span class="station_closed">${this.config.combinedOptions.closed}</span>` : prices[stationValue.station].status === "no prices" ? `<span class="station_no_prices">${this.config.combinedOptions.noPrice}</span>` : prices[stationValue.station].status === "not found" || prices[stationValue.station].status === "no stations" ? `<span class="station_not_found">${this.config.combinedOptions.notFound}</span>` : null,
              ack: true
            });
            await this.setStateAsync(`stations.cheapest.e5.status`, {
              val: newE5[0].status,
              ack: true
            });
          }
          await this.setStateAsync(`stations.cheapest.e5.street`, {
            val: stationValue.street ? stationValue.street.length > 0 ? stationValue.street : "" : "",
            ack: true
          });
          if (stationValue.street && stationValue.houseNumber) {
            if (stationValue.houseNumber.length > 0) {
              await this.setStateAsync(`stations.cheapest.e5.fullStreet`, {
                val: `${stationValue.street} ${stationValue.houseNumber}`,
                ack: true
              });
            } else {
              await this.setStateAsync(`stations.cheapest.e5.fullStreet`, {
                val: stationValue.street,
                ack: true
              });
            }
          } else {
            await this.setStateAsync(`stations.cheapest.e5.fullStreet`, {
              val: "",
              ack: true
            });
          }
          await this.setStateAsync(`stations.cheapest.e5.city`, {
            val: stationValue.city ? stationValue.city.length > 0 ? stationValue.city : "" : "",
            ack: true
          });
          await this.setStateAsync(`stations.cheapest.e5.postCode`, {
            val: stationValue.postCode ? stationValue.postCode.length > 0 ? stationValue.postCode : "" : "",
            ack: true
          });
          await this.setStateAsync(`stations.cheapest.e5.houseNumber`, {
            val: stationValue.houseNumber ? stationValue.houseNumber.length > 0 ? stationValue.houseNumber : "" : "",
            ack: true
          });
          await this.setStateAsync(`stations.cheapest.e5.latitude`, {
            val: stationValue.latitude ? stationValue.latitude > 0 ? stationValue.latitude : 0 : 0,
            ack: true
          });
          await this.setStateAsync(`stations.cheapest.e5.longitude`, {
            val: stationValue.longitude ? stationValue.longitude > 0 ? stationValue.longitude : 0 : 0,
            ack: true
          });
          await this.setStateAsync(`stations.cheapest.e5.wholeDay`, {
            val: stationValue.wholeDay ? stationValue.wholeDay : false,
            ack: true
          });
          if (stationValue.openingTimes) {
            if (stationValue.openingTimes.length > 0) {
              if (stationValue.openingTimes !== "noData") {
                await this.setStateAsync(`stations.cheapest.e5.openingTimes`, {
                  val: JSON.stringify(stationValue.openingTimes),
                  ack: true
                });
              } else {
                await this.setStateAsync(`stations.cheapest.e5.openingTimes`, {
                  val: "no Data",
                  ack: true
                });
              }
            } else {
              await this.setStateAsync(`stations.cheapest.e5.openingTimes`, {
                val: "no Data",
                ack: true
              });
            }
          } else {
            await this.setStateAsync(`stations.cheapest.e5.openingTimes`, {
              val: "no data",
              ack: true
            });
          }
          if (stationValue.overrides) {
            if (stationValue.overrides.length > 0) {
              if (stationValue.overrides !== "noData") {
                await this.setStateAsync(`stations.cheapest.e5.overrides`, {
                  val: JSON.stringify(stationValue.overrides),
                  ack: true
                });
              } else {
                await this.setStateAsync(`stations.cheapest.e5.overrides`, {
                  val: "no Data",
                  ack: true
                });
              }
            } else {
              await this.setStateAsync(`stations.cheapest.e5.overrides`, {
                val: "no Data",
                ack: true
              });
            }
          } else {
            await this.setStateAsync(`stations.cheapest.e5.overrides`, {
              val: "no data",
              ack: true
            });
          }
        }
        if (stationValue.station === newE10[0].station) {
          this.writeLog(`write the cheapest e10 to the states`, "debug");
          if (newE10[0].status === "open") {
            await this.setStateAsync(`stations.cheapest.e10.feed`, {
              val: parseFloat(newE10[0].e10),
              ack: true
            });
            await this.setStateAsync(`stations.cheapest.e10.station_id`, {
              val: newE10[0].station,
              ack: true
            });
            await this.setStateAsync(`stations.cheapest.e10.name`, {
              val: stationValue.stationname,
              ack: true
            });
            await this.setStateAsync(`stations.cheapest.e10.status`, {
              val: newE10[0].status,
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
            const cutPrice = await this.cutPrice(newE10[0].e10);
            await this.setStateAsync(`stations.cheapest.e10.3rd`, {
              val: cutPrice.price3rd,
              ack: true
            });
            await this.setStateAsync(`stations.cheapest.e10.difference`, {
              val: await this.calcPriceDiff(
                `stations.cheapest.e10.short`,
                `stations.cheapest.e10.difference`,
                cutPrice.priceshort
              ),
              ack: true
            });
            await this.setStateAsync(`stations.cheapest.e10.short`, {
              val: cutPrice.priceshort,
              ack: true
            });
            await this.setStateAsync(`stations.cheapest.e10.cheapest_stations`, {
              val: JSON.stringify(allCheapestE10),
              ack: true
            });
            const combined = `<span class="station_open">${cutPrice.priceshort}<sup style="font-size: 50%">${cutPrice.price3rd}</sup> <span class="station_combined_euro">\u20AC</span></span>`;
            await this.setStateAsync(`stations.cheapest.e10.combined`, {
              val: combined,
              ack: true
            });
            this.writeLog(
              `Cheapest gas station for e10: ${stationValue.stationname}  id: ${newE10[0].station}`,
              "debug"
            );
          } else {
            await this.setStateAsync(`stations.cheapest.e10.feed`, {
              val: await this.oldState(`stations.cheapest.e10.feed`),
              ack: true,
              q: 64
            });
            const short = await this.oldState(`stations.cheapest.e10.short`);
            await this.setStateAsync(`stations.cheapest.e10.short`, {
              val: short.toString(),
              ack: true,
              q: 64
            });
            await this.setStateAsync(`stations.cheapest.e10.combined`, {
              val: prices[stationValue.station].status === "closed" ? `<span class="station_closed">${this.config.combinedOptions.closed}</span>` : prices[stationValue.station].status === "no prices" ? `<span class="station_no_prices">${this.config.combinedOptions.noPrice}</span>` : prices[stationValue.station].status === "not found" || prices[stationValue.station].status === "no stations" ? `<span class="station_not_found">${this.config.combinedOptions.notFound}</span>` : null,
              ack: true
            });
            await this.setStateAsync(`stations.cheapest.e10.status`, {
              val: newE10[0].status,
              ack: true
            });
          }
          await this.setStateAsync(`stations.cheapest.e10.street`, {
            val: stationValue.street ? stationValue.street.length > 0 ? stationValue.street : "" : "",
            ack: true
          });
          if (stationValue.street && stationValue.houseNumber) {
            if (stationValue.houseNumber.length > 0) {
              await this.setStateAsync(`stations.cheapest.e10.fullStreet`, {
                val: `${stationValue.street} ${stationValue.houseNumber}`,
                ack: true
              });
            } else {
              await this.setStateAsync(`stations.cheapest.e10.fullStreet`, {
                val: stationValue.street,
                ack: true
              });
            }
          } else {
            await this.setStateAsync(`stations.cheapest.e10.fullStreet`, {
              val: "",
              ack: true
            });
          }
          await this.setStateAsync(`stations.cheapest.e10.city`, {
            val: stationValue.city ? stationValue.city.length > 0 ? stationValue.city : "" : "",
            ack: true
          });
          await this.setStateAsync(`stations.cheapest.e10.postCode`, {
            val: stationValue.postCode ? stationValue.postCode.length > 0 ? stationValue.postCode : "" : "",
            ack: true
          });
          await this.setStateAsync(`stations.cheapest.e10.houseNumber`, {
            val: stationValue.houseNumber ? stationValue.houseNumber.length > 0 ? stationValue.houseNumber : "" : "",
            ack: true
          });
          await this.setStateAsync(`stations.cheapest.e10.latitude`, {
            val: stationValue.latitude ? stationValue.latitude > 0 ? stationValue.latitude : 0 : 0,
            ack: true
          });
          await this.setStateAsync(`stations.cheapest.e10.longitude`, {
            val: stationValue.longitude ? stationValue.longitude > 0 ? stationValue.longitude : 0 : 0,
            ack: true
          });
          await this.setStateAsync(`stations.cheapest.e10.wholeDay`, {
            val: stationValue.wholeDay,
            ack: true
          });
          if (stationValue.openingTimes) {
            if (stationValue.openingTimes.length > 0) {
              if (stationValue.openingTimes !== "noData") {
                await this.setStateAsync(`stations.cheapest.e10.openingTimes`, {
                  val: JSON.stringify(stationValue.openingTimes),
                  ack: true
                });
              } else {
                await this.setStateAsync(`stations.cheapest.e10.openingTimes`, {
                  val: "no Data",
                  ack: true
                });
              }
            } else {
              await this.setStateAsync(`stations.cheapest.e10.openingTimes`, {
                val: "no Data",
                ack: true
              });
            }
          } else {
            await this.setStateAsync(`stations.cheapest.e10.openingTimes`, {
              val: "no data",
              ack: true
            });
          }
          if (stationValue.overrides) {
            if (stationValue.overrides.length > 0) {
              if (stationValue.overrides !== "noData") {
                await this.setStateAsync(`stations.cheapest.e10.overrides`, {
                  val: JSON.stringify(stationValue.overrides),
                  ack: true
                });
              } else {
                await this.setStateAsync(`stations.cheapest.e10.overrides`, {
                  val: "no Data",
                  ack: true
                });
              }
            } else {
              await this.setStateAsync(`stations.cheapest.e10.overrides`, {
                val: "no Data",
                ack: true
              });
            }
          } else {
            await this.setStateAsync(`stations.cheapest.e10.overrides`, {
              val: "no data",
              ack: true
            });
          }
        }
        if (stationValue.station === newDiesel[0].station) {
          this.writeLog(`write the cheapest diesel to the states`, "debug");
          if (newDiesel[0].status === "open") {
            await this.setStateAsync(`stations.cheapest.diesel.feed`, {
              val: parseFloat(newDiesel[0].diesel),
              ack: true
            });
            await this.setStateAsync(`stations.cheapest.diesel.station_id`, {
              val: newDiesel[0].station,
              ack: true
            });
            await this.setStateAsync(`stations.cheapest.diesel.name`, {
              val: stationValue.stationname,
              ack: true
            });
            await this.setStateAsync(`stations.cheapest.diesel.status`, {
              val: newDiesel[0].status,
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
            const cutPrice = await this.cutPrice(newDiesel[0].diesel);
            await this.setStateAsync(`stations.cheapest.diesel.3rd`, {
              val: cutPrice.price3rd,
              ack: true
            });
            await this.setStateAsync(`stations.cheapest.diesel.difference`, {
              val: await this.calcPriceDiff(
                `stations.cheapest.diesel.short`,
                `stations.cheapest.diesel.difference`,
                cutPrice.priceshort
              ),
              ack: true
            });
            await this.setStateAsync(`stations.cheapest.diesel.short`, {
              val: cutPrice.priceshort,
              ack: true
            });
            await this.setStateAsync(`stations.cheapest.diesel.cheapest_stations`, {
              val: JSON.stringify(allCheapestDiesel),
              ack: true
            });
            const combined = `<span class="station_open">${cutPrice.priceshort}<sup style="font-size: 50%">${cutPrice.price3rd}</sup> <span class="station_combined_euro">\u20AC</span></span>`;
            await this.setStateAsync(`stations.cheapest.diesel.combined`, {
              val: combined,
              ack: true
            });
            this.writeLog(
              `Cheapest gas station for diesel: ${stationValue.stationname}  id: ${newDiesel[0].station}`,
              "debug"
            );
          } else {
            await this.setStateAsync(`stations.cheapest.diesel.feed`, {
              val: await this.oldState(`stations.cheapest.diesel.feed`),
              ack: true,
              q: 64
            });
            const short = await this.oldState(`stations.cheapest.diesel.short`);
            await this.setStateAsync(`stations.cheapest.diesel.short`, {
              val: short.toString(),
              ack: true,
              q: 64
            });
            await this.setStateAsync(`stations.cheapest.diesel.combined`, {
              val: prices[stationValue.station].status === "closed" ? `<span class="station_closed">${this.config.combinedOptions.closed}</span>` : prices[stationValue.station].status === "no prices" ? `<span class="station_no_prices">${this.config.combinedOptions.noPrice}</span>` : prices[stationValue.station].status === "not found" || prices[stationValue.station].status === "no stations" ? `<span class="station_not_found">${this.config.combinedOptions.notFound}</span>` : null,
              ack: true
            });
            await this.setStateAsync(`stations.cheapest.diesel.status`, {
              val: newDiesel[0].status,
              ack: true
            });
          }
          await this.setStateAsync(`stations.cheapest.diesel.street`, {
            val: stationValue.street ? stationValue.street.length > 0 ? stationValue.street : "" : "",
            ack: true
          });
          if (stationValue.street && stationValue.houseNumber) {
            if (stationValue.houseNumber.length > 0) {
              await this.setStateAsync(`stations.cheapest.diesel.fullStreet`, {
                val: `${stationValue.street} ${stationValue.houseNumber}`,
                ack: true
              });
            } else {
              await this.setStateAsync(`stations.cheapest.diesel.fullStreet`, {
                val: stationValue.street,
                ack: true
              });
            }
          } else {
            await this.setStateAsync(`stations.cheapest.diesel.fullStreet`, {
              val: "",
              ack: true
            });
          }
          await this.setStateAsync(`stations.cheapest.diesel.city`, {
            val: stationValue.city ? stationValue.city.length > 0 ? stationValue.city : "" : "",
            ack: true
          });
          await this.setStateAsync(`stations.cheapest.diesel.postCode`, {
            val: stationValue.postCode ? stationValue.postCode.length > 0 ? stationValue.postCode : "" : "",
            ack: true
          });
          await this.setStateAsync(`stations.cheapest.diesel.houseNumber`, {
            val: stationValue.houseNumber ? stationValue.houseNumber.length > 0 ? stationValue.houseNumber : "" : "",
            ack: true
          });
          await this.setStateAsync(`stations.cheapest.diesel.latitude`, {
            val: stationValue.latitude ? stationValue.latitude > 0 ? stationValue.latitude : 0 : 0,
            ack: true
          });
          await this.setStateAsync(`stations.cheapest.diesel.longitude`, {
            val: stationValue.longitude ? stationValue.longitude > 0 ? stationValue.longitude : 0 : 0,
            ack: true
          });
          await this.setStateAsync(`stations.cheapest.diesel.wholeDay`, {
            val: stationValue.wholeDay ? stationValue.wholeDay : false,
            ack: true
          });
          if (stationValue.openingTimes) {
            if (stationValue.openingTimes.length > 0) {
              if (stationValue.openingTimes !== "noData") {
                await this.setStateAsync(`stations.cheapest.diesel.openingTimes`, {
                  val: JSON.stringify(stationValue.openingTimes),
                  ack: true
                });
              } else {
                await this.setStateAsync(`stations.cheapest.diesel.openingTimes`, {
                  val: "no Data",
                  ack: true
                });
              }
            } else {
              await this.setStateAsync(`stations.cheapest.diesel.openingTimes`, {
                val: "no Data",
                ack: true
              });
            }
          } else {
            await this.setStateAsync(`stations.cheapest.diesel.openingTimes`, {
              val: "no data",
              ack: true
            });
          }
          if (stationValue.overrides) {
            if (stationValue.overrides.length > 0) {
              if (stationValue.overrides !== "noData") {
                await this.setStateAsync(`stations.cheapest.diesel.overrides`, {
                  val: JSON.stringify(stationValue.overrides),
                  ack: true
                });
              } else {
                await this.setStateAsync(`stations.cheapest.diesel.overrides`, {
                  val: "no Data",
                  ack: true
                });
              }
            } else {
              await this.setStateAsync(`stations.cheapest.diesel.overrides`, {
                val: "no Data",
                ack: true
              });
            }
          } else {
            await this.setStateAsync(`stations.cheapest.diesel.overrides`, {
              val: "no data",
              ack: true
            });
          }
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
            await this.setStateAsync(`stations.${key}.street`, {
              val: stationValue.street ? stationValue.street.length > 0 ? stationValue.street : "" : "",
              ack: true
            });
            if (stationValue.street && stationValue.houseNumber) {
              if (stationValue.houseNumber.length > 0) {
                await this.setStateAsync(`stations.${key}.fullStreet`, {
                  val: `${stationValue.street} ${stationValue.houseNumber}`,
                  ack: true
                });
              } else {
                await this.setStateAsync(`stations.${key}.fullStreet`, {
                  val: stationValue.street,
                  ack: true
                });
              }
            } else {
              await this.setStateAsync(`stations.${key}.fullStreet`, {
                val: "",
                ack: true
              });
            }
            await this.setStateAsync(`stations.${key}.city`, {
              val: stationValue.city ? stationValue.city.length > 0 ? stationValue.city : "" : "",
              ack: true
            });
            await this.setStateAsync(`stations.${key}.postCode`, {
              val: stationValue.postCode ? stationValue.postCode.length > 0 ? stationValue.postCode : "" : "",
              ack: true
            });
            await this.setStateAsync(`stations.${key}.houseNumber`, {
              val: stationValue.houseNumber ? stationValue.houseNumber.length > 0 ? stationValue.houseNumber : "" : "",
              ack: true
            });
            await this.setStateAsync(`stations.${key}.latitude`, {
              val: stationValue.latitude ? stationValue.latitude : 0,
              ack: true
            });
            await this.setStateAsync(`stations.${key}.longitude`, {
              val: stationValue.longitude ? stationValue.longitude : 0,
              ack: true
            });
            await this.setStateAsync(`stations.${key}.wholeDay`, {
              val: stationValue.wholeDay ? stationValue.wholeDay : false,
              ack: true
            });
            if (stationValue.openingTimes) {
              if (stationValue.openingTimes.length > 0) {
                if (stationValue.openingTimes !== "noData") {
                  await this.setStateAsync(`stations.${key}.openingTimes`, {
                    val: JSON.stringify(stationValue.openingTimes),
                    ack: true
                  });
                } else {
                  await this.setStateAsync(`stations.${key}.openingTimes`, {
                    val: "no Data",
                    ack: true
                  });
                }
              } else {
                await this.setStateAsync(`stations.${key}.openingTimes`, {
                  val: "no Data",
                  ack: true
                });
              }
            } else {
              await this.setStateAsync(`stations.${key}.openingTimes`, {
                val: "no data",
                ack: true
              });
            }
            if (stationValue.overrides) {
              if (stationValue.overrides.length > 0) {
                if (stationValue.overrides !== "noData") {
                  await this.setStateAsync(`stations.${key}.overrides`, {
                    val: JSON.stringify(stationValue.overrides),
                    ack: true
                  });
                } else {
                  await this.setStateAsync(`stations.${key}.overrides`, {
                    val: "no Data",
                    ack: true
                  });
                }
              } else {
                await this.setStateAsync(`stations.${key}.overrides`, {
                  val: "no Data",
                  ack: true
                });
              }
            } else {
              await this.setStateAsync(`stations.${key}.overrides`, {
                val: "no data",
                ack: true
              });
            }
            for (const fuelTypesKey in this.fuelTypes) {
              if (this.fuelTypes.hasOwnProperty(fuelTypesKey)) {
                const feedMinDay = await this.dayState(
                  `stations.${key}.${this.fuelTypes[fuelTypesKey]}.minmax.feed_min`
                );
                const now = new Date();
                if (now.getDate() !== feedMinDay) {
                  await this.setStateAsync(
                    `stations.${key}.${this.fuelTypes[fuelTypesKey]}.minmax.feed_min`,
                    {
                      val: 0,
                      ack: true
                    }
                  );
                  await this.setStateAsync(
                    `stations.${key}.${this.fuelTypes[fuelTypesKey]}.minmax.lastUpdate_min`,
                    {
                      val: Date.now(),
                      ack: true
                    }
                  );
                  await this.setStateAsync(
                    `stations.${key}.${this.fuelTypes[fuelTypesKey]}.minmax.lastUpdate_max`,
                    {
                      val: Date.now(),
                      ack: true
                    }
                  );
                  await this.setStateAsync(
                    `stations.${key}.${this.fuelTypes[fuelTypesKey]}.minmax.3rd_min`,
                    {
                      val: 0,
                      ack: true
                    }
                  );
                  await this.setStateAsync(
                    `stations.${key}.${this.fuelTypes[fuelTypesKey]}.minmax.short_min`,
                    {
                      val: "0",
                      ack: true
                    }
                  );
                  await this.setStateAsync(
                    `stations.${key}.${this.fuelTypes[fuelTypesKey]}.minmax.combined_min`,
                    {
                      val: "",
                      ack: true
                    }
                  );
                  await this.setStateAsync(
                    `stations.${key}.${this.fuelTypes[fuelTypesKey]}.minmax.feed_max`,
                    {
                      val: 0,
                      ack: true
                    }
                  );
                  await this.setStateAsync(
                    `stations.${key}.${this.fuelTypes[fuelTypesKey]}.minmax.3rd_max`,
                    {
                      val: 0,
                      ack: true
                    }
                  );
                  await this.setStateAsync(
                    `stations.${key}.${this.fuelTypes[fuelTypesKey]}.minmax.short_max`,
                    {
                      val: "0",
                      ack: true
                    }
                  );
                  await this.setStateAsync(
                    `stations.${key}.${this.fuelTypes[fuelTypesKey]}.minmax.combined_max`,
                    {
                      val: "",
                      ack: true
                    }
                  );
                  this.writeLog(
                    `Min/Max prices have been reset, because we have an new day. Today: ${now.getDate()} // Day of ${key}.${this.fuelTypes[fuelTypesKey]}.minmax.feed_min: ${feedMinDay}`,
                    "debug"
                  );
                }
              }
            }
            if (prices[stationValue.station].status === "open") {
              for (const fuelTypesKey in this.fuelTypes) {
                if (this.fuelTypes.hasOwnProperty(fuelTypesKey)) {
                  if (prices[stationValue.station][this.fuelTypes[fuelTypesKey]]) {
                    await this.setStateAsync(
                      `stations.${key}.${this.fuelTypes[fuelTypesKey]}.feed`,
                      {
                        val: parseFloat(
                          prices[stationValue.station][this.fuelTypes[fuelTypesKey]]
                        ),
                        ack: true
                      }
                    );
                    const pricesObj = await this.cutPrice(
                      prices[stationValue.station][this.fuelTypes[fuelTypesKey]]
                    );
                    await this.setStateAsync(
                      `stations.${key}.${this.fuelTypes[fuelTypesKey]}.3rd`,
                      {
                        val: pricesObj.price3rd,
                        ack: true
                      }
                    );
                    await this.setStateAsync(
                      `stations.${key}.${this.fuelTypes[fuelTypesKey]}.difference`,
                      {
                        val: await this.calcPriceDiff(
                          `stations.${key}.${this.fuelTypes[fuelTypesKey]}.short`,
                          `stations.${key}.${this.fuelTypes[fuelTypesKey]}.difference`,
                          pricesObj.priceshort
                        ),
                        ack: true
                      }
                    );
                    await this.setStateAsync(
                      `stations.${key}.${this.fuelTypes[fuelTypesKey]}.short`,
                      {
                        val: pricesObj.priceshort,
                        ack: true
                      }
                    );
                    const combined = `<span class="station_open">${pricesObj.priceshort}<sup style="font-size: 50%">${pricesObj.price3rd}</sup> <span class="station_combined_euro">\u20AC</span></span>`;
                    await this.setStateAsync(
                      `stations.${key}.${this.fuelTypes[fuelTypesKey]}.combined`,
                      {
                        val: combined,
                        ack: true
                      }
                    );
                    const feed_min = await this.oldState(
                      `stations.${key}.${this.fuelTypes[fuelTypesKey]}.minmax.feed_min`
                    );
                    if ((feed_min >= parseFloat(
                      prices[stationValue.station][this.fuelTypes[fuelTypesKey]]
                    ) || feed_min === 0) && (feed_min !== void 0 || true)) {
                      if (feed_min > parseFloat(
                        prices[stationValue.station][this.fuelTypes[fuelTypesKey]]
                      )) {
                        await this.setStateAsync(
                          `stations.${key}.${this.fuelTypes[fuelTypesKey]}.minmax.lastUpdate_min`,
                          {
                            val: Date.now(),
                            ack: true
                          }
                        );
                      }
                      this.writeLog(
                        `New minimum price for ${key}.${this.fuelTypes[fuelTypesKey]}: ${parseFloat(
                          prices[stationValue.station][this.fuelTypes[fuelTypesKey]]
                        )}`,
                        "debug"
                      );
                      await this.setStateAsync(
                        `stations.${key}.${this.fuelTypes[fuelTypesKey]}.minmax.feed_min`,
                        {
                          val: parseFloat(
                            prices[stationValue.station][this.fuelTypes[fuelTypesKey]]
                          ),
                          ack: true
                        }
                      );
                      await this.setStateAsync(
                        `stations.${key}.${this.fuelTypes[fuelTypesKey]}.minmax.3rd_min`,
                        {
                          val: pricesObj.price3rd,
                          ack: true
                        }
                      );
                      await this.setStateAsync(
                        `stations.${key}.${this.fuelTypes[fuelTypesKey]}.minmax.short_min`,
                        {
                          val: pricesObj.priceshort,
                          ack: true
                        }
                      );
                      await this.setStateAsync(
                        `stations.${key}.${this.fuelTypes[fuelTypesKey]}.minmax.combined_min`,
                        {
                          val: combined,
                          ack: true
                        }
                      );
                    }
                    const feed_max = await this.oldState(
                      `stations.${key}.${this.fuelTypes[fuelTypesKey]}.minmax.feed_max`
                    );
                    if ((feed_max <= parseFloat(
                      prices[stationValue.station][this.fuelTypes[fuelTypesKey]]
                    ) || feed_max === 0) && (feed_max !== void 0 || true)) {
                      if (feed_max < parseFloat(
                        prices[stationValue.station][this.fuelTypes[fuelTypesKey]]
                      )) {
                        await this.setStateAsync(
                          `stations.${key}.${this.fuelTypes[fuelTypesKey]}.minmax.lastUpdate_max`,
                          {
                            val: Date.now(),
                            ack: true
                          }
                        );
                      }
                      this.writeLog(
                        `New maximum price for ${key}.${this.fuelTypes[fuelTypesKey]}: ${parseFloat(
                          prices[stationValue.station][this.fuelTypes[fuelTypesKey]]
                        )}`,
                        "debug"
                      );
                      await this.setStateAsync(
                        `stations.${key}.${this.fuelTypes[fuelTypesKey]}.minmax.feed_max`,
                        {
                          val: parseFloat(
                            prices[stationValue.station][this.fuelTypes[fuelTypesKey]]
                          ),
                          ack: true
                        }
                      );
                      await this.setStateAsync(
                        `stations.${key}.${this.fuelTypes[fuelTypesKey]}.minmax.3rd_max`,
                        {
                          val: pricesObj.price3rd,
                          ack: true
                        }
                      );
                      await this.setStateAsync(
                        `stations.${key}.${this.fuelTypes[fuelTypesKey]}.minmax.short_max`,
                        {
                          val: pricesObj.priceshort,
                          ack: true
                        }
                      );
                      await this.setStateAsync(
                        `stations.${key}.${this.fuelTypes[fuelTypesKey]}.minmax.combined_max`,
                        {
                          val: combined,
                          ack: true
                        }
                      );
                    }
                  } else {
                    const short = await this.oldState(
                      `stations.${key}.${this.fuelTypes[fuelTypesKey]}.short`
                    );
                    if (short !== void 0 || true) {
                      await this.setStateAsync(
                        `stations.${key}.${this.fuelTypes[fuelTypesKey]}.short`,
                        {
                          val: short.toString(),
                          ack: true,
                          q: 64
                        }
                      );
                    } else {
                      await this.setStateAsync(
                        `stations.${key}.${this.fuelTypes[fuelTypesKey]}.short`,
                        {
                          val: "0",
                          ack: true,
                          q: 64
                        }
                      );
                    }
                    await this.setStateAsync(
                      `stations.${key}.${this.fuelTypes[fuelTypesKey]}.feed`,
                      {
                        val: await this.oldState(
                          `stations.${key}.${this.fuelTypes[fuelTypesKey]}.feed`
                        ),
                        ack: true,
                        q: 64
                      }
                    );
                    await this.setStateAsync(
                      `stations.${key}.${this.fuelTypes[fuelTypesKey]}.combined`,
                      {
                        val: `<span class="station_no_prices">${this.config.combinedOptions.noPrice}</span>`,
                        ack: true
                      }
                    );
                    await this.setStateAsync(
                      `stations.${key}.${this.fuelTypes[fuelTypesKey]}.minmax.feed_min`,
                      {
                        val: await this.oldState(
                          `stations.${key}.${this.fuelTypes[fuelTypesKey]}.minmax.feed_min`
                        ),
                        ack: true,
                        q: 64
                      }
                    );
                    const shortmin = await this.oldState(
                      `stations.${key}.${this.fuelTypes[fuelTypesKey]}.minmax.short_min`
                    );
                    await this.setStateAsync(
                      `stations.${key}.${this.fuelTypes[fuelTypesKey]}.minmax.short_min`,
                      {
                        val: shortmin.toString(),
                        ack: true,
                        q: 64
                      }
                    );
                    await this.setStateAsync(
                      `stations.${key}.${this.fuelTypes[fuelTypesKey]}.minmax.combined_min`,
                      {
                        val: `<span class="station_no_prices">${this.config.combinedOptions.noPrice}</span>`,
                        ack: true
                      }
                    );
                    await this.setStateAsync(
                      `stations.${key}.${this.fuelTypes[fuelTypesKey]}.minmax.feed_max`,
                      {
                        val: await this.oldState(
                          `stations.${key}.${this.fuelTypes[fuelTypesKey]}.minmax.feed_max`
                        ),
                        ack: true,
                        q: 64
                      }
                    );
                    const shortmax = await this.oldState(
                      `stations.${key}.${this.fuelTypes[fuelTypesKey]}.minmax.short_max`
                    );
                    await this.setStateAsync(
                      `stations.${key}.${this.fuelTypes[fuelTypesKey]}.minmax.short_max`,
                      {
                        val: shortmax.toString(),
                        ack: true,
                        q: 64
                      }
                    );
                    await this.setStateAsync(
                      `stations.${key}.${this.fuelTypes[fuelTypesKey]}.minmax.combined_max`,
                      {
                        val: `<span class="station_no_prices">${this.config.combinedOptions.noPrice}</span>`,
                        ack: true
                      }
                    );
                    this.writeLog(
                      `There is no ${this.fuelTypes[fuelTypesKey]} in the ${stationValue.stationname} ID: ${stationValue.station} station.`,
                      "debug"
                    );
                  }
                }
              }
            } else if (prices[stationValue.station].status === "closed") {
              if (this.config.resetValues) {
                for (const fuelTypesKey in this.fuelTypes) {
                  if (this.fuelTypes.hasOwnProperty(fuelTypesKey)) {
                    await this.setStateAsync(
                      `stations.${key}.${this.fuelTypes[fuelTypesKey]}.feed`,
                      {
                        val: 0,
                        ack: true
                      }
                    );
                    await this.setStateAsync(
                      `stations.${key}.${this.fuelTypes[fuelTypesKey]}.short`,
                      {
                        val: "0",
                        ack: true
                      }
                    );
                    await this.setStateAsync(
                      `stations.${key}.${this.fuelTypes[fuelTypesKey]}.combined`,
                      {
                        val: `<span class="station_closed">${this.config.combinedOptions.closed}</span>`,
                        ack: true
                      }
                    );
                  }
                }
              } else {
                for (const fuelTypesKey in this.fuelTypes) {
                  if (this.fuelTypes.hasOwnProperty(fuelTypesKey)) {
                    await this.setStateAsync(
                      `stations.${key}.${this.fuelTypes[fuelTypesKey]}.feed`,
                      {
                        val: await this.oldState(
                          `stations.${key}.${this.fuelTypes[fuelTypesKey]}.feed`
                        ),
                        ack: true,
                        q: 64
                      }
                    );
                    const short = await this.oldState(
                      `stations.${key}.${this.fuelTypes[fuelTypesKey]}.short`
                    );
                    await this.setStateAsync(
                      `stations.${key}.${this.fuelTypes[fuelTypesKey]}.short`,
                      {
                        val: short.toString(),
                        ack: true,
                        q: 64
                      }
                    );
                    await this.setStateAsync(
                      `stations.${key}.${this.fuelTypes[fuelTypesKey]}.combined`,
                      {
                        val: `<span class="station_closed">${this.config.combinedOptions.closed}</span>`,
                        ack: true
                      }
                    );
                  }
                }
              }
              if (prices[stationValue.station].status === "closed")
                this.writeLog(`${stationValue.stationname} is Closed`, `debug`);
            } else if (prices[stationValue.station].status === "no prices" || prices[stationValue.station].status === "not found" || prices[stationValue.station].status === "no stations") {
              for (const fuelTypesKey in this.fuelTypes) {
                if (this.fuelTypes.hasOwnProperty(fuelTypesKey)) {
                  await this.setStateAsync(
                    `stations.${key}.${this.fuelTypes[fuelTypesKey]}.feed`,
                    {
                      val: await this.oldState(
                        `stations.${key}.${this.fuelTypes[fuelTypesKey]}.feed`
                      ),
                      ack: true,
                      q: 64
                    }
                  );
                  const short = await this.oldState(
                    `stations.${key}.${this.fuelTypes[fuelTypesKey]}.short`
                  );
                  await this.setStateAsync(
                    `stations.${key}.${this.fuelTypes[fuelTypesKey]}.short`,
                    {
                      val: short.toString(),
                      ack: true,
                      q: 64
                    }
                  );
                  await this.setStateAsync(
                    `stations.${key}.${this.fuelTypes[fuelTypesKey]}.combined`,
                    {
                      val: prices[stationValue.station].status === "closed" ? `<span class="station_closed">${this.config.combinedOptions.closed}</span>` : prices[stationValue.station].status === "no prices" ? `<span class="station_no_prices">${this.config.combinedOptions.noPrice}</span>` : prices[stationValue.station].status === "not found" || prices[stationValue.station].status === "no stations" ? `<span class="station_not_found">${this.config.combinedOptions.notFound}</span>` : null,
                      ack: true,
                      q: 0
                    }
                  );
                  await this.setStateAsync(
                    `stations.${key}.${this.fuelTypes[fuelTypesKey]}.minmax.feed_min`,
                    {
                      val: await this.oldState(
                        `stations.${key}.${this.fuelTypes[fuelTypesKey]}.minmax.feed_min`
                      ),
                      ack: true,
                      q: 64
                    }
                  );
                  const shortmin = await this.oldState(
                    `stations.${key}.${this.fuelTypes[fuelTypesKey]}.minmax.short_min`
                  );
                  await this.setStateAsync(
                    `stations.${key}.${this.fuelTypes[fuelTypesKey]}.minmax.short_min`,
                    {
                      val: shortmin.toString(),
                      ack: true,
                      q: 64
                    }
                  );
                  await this.setStateAsync(
                    `stations.${key}.${this.fuelTypes[fuelTypesKey]}.minmax.combined_min`,
                    {
                      val: prices[stationValue.station].status === "closed" ? `<span class="station_closed">${this.config.combinedOptions.closed}</span>` : prices[stationValue.station].status === "no prices" ? `<span class="station_no_prices">${this.config.combinedOptions.noPrice}</span>` : prices[stationValue.station].status === "not found" || prices[stationValue.station].status === "no stations" ? `<span class="station_not_found">${this.config.combinedOptions.notFound}</span>` : null,
                      ack: true,
                      q: 0
                    }
                  );
                  await this.setStateAsync(
                    `stations.${key}.${this.fuelTypes[fuelTypesKey]}.minmax.feed_max`,
                    {
                      val: await this.oldState(
                        `stations.${key}.${this.fuelTypes[fuelTypesKey]}.minmax.feed_max`
                      ),
                      ack: true,
                      q: 64
                    }
                  );
                  const shortmax = await this.oldState(
                    `stations.${key}.${this.fuelTypes[fuelTypesKey]}.minmax.short_max`
                  );
                  await this.setStateAsync(
                    `stations.${key}.${this.fuelTypes[fuelTypesKey]}.minmax.short_max`,
                    {
                      val: shortmax.toString(),
                      ack: true,
                      q: 64
                    }
                  );
                  await this.setStateAsync(
                    `stations.${key}.${this.fuelTypes[fuelTypesKey]}.minmax.combined_max`,
                    {
                      val: prices[stationValue.station].status === "closed" ? `<span class="station_closed">${this.config.combinedOptions.closed}</span>` : prices[stationValue.station].status === "no prices" ? `<span class="station_no_prices">${this.config.combinedOptions.noPrice}</span>` : prices[stationValue.station].status === "not found" || prices[stationValue.station].status === "no stations" ? `<span class="station_not_found">${this.config.combinedOptions.notFound}</span>` : null,
                      ack: true,
                      q: 0
                    }
                  );
                }
              }
              if (prices[stationValue.station].status === "no prices")
                this.writeLog(`there are no prices at ${stationValue.stationname}`, `warn`);
              if (prices[stationValue.station].status === "not found" || prices[stationValue.station].status === "no stations")
                this.writeLog(
                  `station ${stationValue.stationname} with ID: ${stationValue.station} was not found`,
                  `warn`
                );
            }
          }
        }
        const JsonTable = await this.createJsonTable(prices, station);
        await this.setStateAsync(`stations.jsonTable`, {
          val: JSON.stringify(JsonTable),
          ack: true
        });
      }
    } catch (error) {
      this.writeLog(
        `[ Adapter V:${this.version} writeState ] error: ${error} stack: ${error.stack}`,
        "error"
      );
    }
  }
  async createJsonTable(price, station) {
    try {
      const jsonTable = [];
      for (const key in station) {
        if (station.hasOwnProperty(key)) {
          for (const [stationID, pricesValue] of Object.entries(price)) {
            if (station[key].station === stationID) {
              if (typeof pricesValue.e5 !== "number") {
                pricesValue.e5 = await this.oldState(`stations.${key}.e5.feed`);
              }
              if (typeof pricesValue.e10 !== "number") {
                pricesValue.e10 = await this.oldState(`stations.${key}.e10.feed`);
              }
              if (typeof pricesValue.diesel !== "number") {
                pricesValue.diesel = await this.oldState(`stations.${key}.diesel.feed`);
              }
              if (pricesValue.status !== "open") {
                pricesValue.e5 = await this.oldState(`stations.${key}.e5.feed`);
                pricesValue.e10 = await this.oldState(`stations.${key}.e10.feed`);
                pricesValue.diesel = await this.oldState(`stations.${key}.diesel.feed`);
              }
              const status = pricesValue.status === "open" ? "open" : pricesValue.status === "closed" ? this.config.combinedOptions.closed : pricesValue.status === "no prices" ? this.config.combinedOptions.noPrice : pricesValue.status === "not found" || pricesValue.status === "no stations" ? this.config.combinedOptions.notFound : "";
              let e5 = pricesValue.e5;
              let e10 = pricesValue.e10;
              let diesel = pricesValue.diesel;
              if (typeof pricesValue.e5 === "number") {
                e5 = parseFloat(pricesValue.e5.toFixed(3));
              }
              if (typeof pricesValue.e10 === "number") {
                e10 = parseFloat(pricesValue.e10.toFixed(3));
              }
              if (typeof pricesValue.diesel === "number") {
                diesel = parseFloat(pricesValue.diesel.toFixed(3));
              }
              const differenceE5 = await this.oldState(`stations.${key}.e5.difference`);
              const differenceE10 = await this.oldState(`stations.${key}.e10.difference`);
              const differenceDiesel = await this.oldState(`stations.${key}.diesel.difference`);
              jsonTable.push({
                station: station[key].stationname,
                status,
                e5,
                differenceE5,
                e10,
                differenceE10,
                diesel,
                differenceDiesel,
                discount: station[key].discounted ? station[key].discountObj.discountType === "percent" ? `${station[key].discountObj.discount}%` : `${station[key].discountObj.discount}\u20AC` : "0"
              });
            }
          }
        }
      }
      return jsonTable;
    } catch (error) {
      this.writeLog(
        `[ Adapter V:${this.version} createJsonTable ] error: ${error} stack: ${error.stack}`,
        "error"
      );
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
      this.writeLog(
        `[ Adapter V:${this.version} cutPrice ] error: ${error} stack: ${error.stack}`,
        "error"
      );
      return { priceshort: "0", price3rd: 0 };
    }
  }
  async addDiscount(price, discount, discountType) {
    try {
      if (price === void 0) {
        price = 0;
        this.writeLog(
          `[ Adapter V:${this.version} addDiscount ] price is undefined Price set to ${price}`,
          "debug"
        );
        console.log("price is undefined");
        return price;
      }
      if (typeof price === "string") {
        console.log("price is string");
        price = parseFloat(price);
        this.writeLog(
          `[ Adapter V:${this.version} addDiscount ] price is string Price parse to a number ${price}`,
          "debug"
        );
      }
      if (typeof price === "boolean") {
        price = 0;
        console.log("price is boolean");
        this.writeLog(
          `[ Adapter V:${this.version} addDiscount ] price is boolean price set to ${price}`,
          "debug"
        );
        return price;
      }
      if (discountType === "percent") {
        this.writeLog(`[ Adapter V:${this.version} addDiscount ] in percent: ${discount}`, "debug");
        const newPrice = price * discount / 100;
        this.writeLog(
          `[ Adapter V:${this.version} addDiscount ] return Price with discount ${price - parseFloat(newPrice.toFixed(2))}`,
          "debug"
        );
        let discountedPrice = price - parseFloat(newPrice.toFixed(2));
        if (discountedPrice.toString().split(".")[1].length > 3) {
          discountedPrice = parseFloat(discountedPrice.toFixed(3));
        }
        this.writeLog(
          `[ Adapter V:${this.version} addDiscount ] return Price with discount ${discountedPrice}`,
          "debug"
        );
        return discountedPrice;
      } else if (discountType === "absolute") {
        this.writeLog(`[ Adapter V:${this.version} addDiscount ] in absolute: ${discount}`, "debug");
        let discountedPrice = parseFloat(parseFloat(String(price - discount)).toFixed(3));
        if (discountedPrice.toString().split(".")[1].length > 3) {
          discountedPrice = parseFloat(discountedPrice.toFixed(3));
        }
        this.writeLog(
          `[ Adapter V:${this.version} addDiscount ] return Price with discount ${discountedPrice}`,
          "debug"
        );
        return discountedPrice;
      }
      return price;
    } catch (error) {
      this.writeLog(
        `[ Adapter V:${this.version} addDiscount ] Error for price ${price} and discount ${discount} and discountType ${discountType} error: ${error} stack: ${error.stack}`,
        "error"
      );
      return parseFloat(price);
    }
  }
  async createAllStates(stations) {
    var _a;
    try {
      this.writeLog("all states are now created", "debug");
      await this.extendObjectAsync("stations.cheapest", {
        type: "channel",
        common: {
          name: "Cheapest gas stations"
        },
        native: {}
      });
      for (const fuelTypesKey in this.fuelTypes) {
        if (this.fuelTypes.hasOwnProperty(fuelTypesKey)) {
          await this.extendObjectAsync(`stations.cheapest.${this.fuelTypes[fuelTypesKey]}`, {
            type: "channel",
            common: {
              name: `cheapest ${this.fuelTypes[fuelTypesKey].toUpperCase()}`
            },
            native: {}
          });
        }
      }
      for (const cheapestObjKey in import_object_definition.cheapestObj) {
        if (import_object_definition.cheapestObj.hasOwnProperty(cheapestObjKey)) {
          for (const fuelTypesKey in this.fuelTypes) {
            if (this.fuelTypes.hasOwnProperty(fuelTypesKey)) {
              await this.extendObjectAsync(
                `stations.cheapest.${this.fuelTypes[fuelTypesKey]}.${cheapestObjKey}`,
                import_object_definition.cheapestObj[cheapestObjKey]
              );
            }
          }
        }
      }
      for (const statesObjKey in import_object_definition.statesObj) {
        if (import_object_definition.statesObj.hasOwnProperty(statesObjKey)) {
          for (const fuelTypesKey in this.fuelTypes) {
            if (this.fuelTypes.hasOwnProperty(fuelTypesKey)) {
              await this.extendObjectAsync(
                `stations.cheapest.${this.fuelTypes[fuelTypesKey]}.${statesObjKey}`,
                import_object_definition.statesObj[statesObjKey]
              );
              for (const priceObjKey in import_object_definition.priceObj) {
                if (import_object_definition.priceObj.hasOwnProperty(priceObjKey)) {
                  if (priceObjKey !== "cheapest") {
                    await this.extendObjectAsync(
                      `stations.cheapest.${this.fuelTypes[fuelTypesKey]}.${priceObjKey}`,
                      {
                        ...import_object_definition.priceObj[priceObjKey],
                        common: {
                          ...import_object_definition.priceObj[priceObjKey].common,
                          name: `cheapest ${this.fuelTypes[fuelTypesKey]} ${priceObjKey}`
                        }
                      }
                    );
                  }
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
            const stationName = `${station.stationname} (${station.street} ${(_a = station.houseNumber) != null ? _a : ""}, ${station.postCode === "" ? "" : station.postCode} ${station.city})`;
            await this.extendObjectAsync(`stations.${stationKey}`, {
              type: "channel",
              common: {
                name: stationName,
                desc: `${station.stationname} ID: ${station.station}`
              },
              native: {}
            });
            for (const fuelTypesKey in this.fuelTypes) {
              if (this.fuelTypes.hasOwnProperty(fuelTypesKey)) {
                await this.extendObjectAsync(
                  `stations.${stationKey}.${this.fuelTypes[fuelTypesKey]}`,
                  {
                    type: "channel",
                    common: {
                      name: this.fuelTypes[fuelTypesKey].toUpperCase()
                    },
                    native: {}
                  }
                );
              }
            }
            for (const statesObjKey in import_object_definition.statesObj) {
              if (import_object_definition.statesObj.hasOwnProperty(statesObjKey)) {
                await this.extendObjectAsync(
                  `stations.${stationKey}.${statesObjKey}`,
                  import_object_definition.statesObj[statesObjKey]
                );
              }
            }
            for (const fuelTypesKey in this.fuelTypes) {
              for (const priceObjKey in import_object_definition.priceObj) {
                if (import_object_definition.priceObj.hasOwnProperty(priceObjKey)) {
                  await this.extendObjectAsync(
                    `stations.${stationKey}.${this.fuelTypes[fuelTypesKey]}.${priceObjKey}`,
                    {
                      ...import_object_definition.priceObj[priceObjKey],
                      common: {
                        ...import_object_definition.priceObj[priceObjKey].common,
                        name: `${this.fuelTypes[fuelTypesKey]} ${priceObjKey}`
                      }
                    }
                  );
                }
              }
              await this.extendObjectAsync(
                `stations.${stationKey}.${this.fuelTypes[fuelTypesKey]}.minmax`,
                {
                  type: "channel",
                  common: {
                    name: "Daily Min/Max"
                  },
                  native: {}
                }
              );
              for (const priceMinMaxObjKey in import_object_definition.priceMinMaxObj) {
                if (import_object_definition.priceMinMaxObj.hasOwnProperty(priceMinMaxObjKey)) {
                  await this.extendObjectAsync(
                    `stations.${stationKey}.${this.fuelTypes[fuelTypesKey]}.minmax.${priceMinMaxObjKey}`,
                    {
                      ...import_object_definition.priceMinMaxObj[priceMinMaxObjKey],
                      common: {
                        ...import_object_definition.priceMinMaxObj[priceMinMaxObjKey].common,
                        name: `${this.fuelTypes[fuelTypesKey]} ${priceMinMaxObjKey}`
                      }
                    }
                  );
                }
              }
            }
          }
        }
      }
      await this.extendObjectAsync(`stations.json`, {
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
      await this.extendObjectAsync(`stations.jsonTable`, {
        type: "state",
        common: {
          name: "JSON Table vor Visualization",
          desc: "JsonTable vor vis with all prices for all stations",
          type: `string`,
          role: `json`,
          def: "",
          read: true,
          write: false
        },
        native: {}
      });
      await this.extendObjectAsync(`stations.lastUpdate`, {
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
      await this.extendObjectAsync(`stations.refresh`, {
        type: "state",
        common: {
          name: "manuel refresh the data from tankerkoenig.de",
          desc: "refresh manual the data from tankerkoenig.de",
          type: `boolean`,
          role: `button`,
          def: true,
          read: true,
          write: true
        },
        native: {}
      });
      await this.subscribeStates(`stations.refresh`);
    } catch (error) {
      this.writeLog(
        `[ Adapter V:${this.version} createObjects ] Error creating all states: ${error} , stack: ${error.stack}`,
        "error"
      );
    }
  }
  writeLog(logtext, logtype) {
    try {
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
    } catch (error) {
      this.log.error(`[ Adapter V:${this.version} writeLog ] error: ${error} , stack: ${error.stack}`);
    }
  }
  onUnload(callback) {
    try {
      this.setState(`stations.adapterStatus`, {
        val: "offline",
        ack: true
      });
      if (this.requestTimeout)
        clearInterval(this.requestTimeout);
      if (this.refreshTimeout)
        clearInterval(this.refreshTimeout);
      if (this.refreshStatusTimeout)
        clearTimeout(this.refreshStatusTimeout);
      if (this.startRequestTimeout)
        clearTimeout(this.startRequestTimeout);
      callback();
    } catch (e) {
      this.writeLog(`[ Adapter V:${this.version} onUnload ] error: ${e} , stack: ${e.stack}`, "error");
      callback();
    }
  }
  async onMessage(obj) {
    try {
      if (typeof obj === "object" && obj.message) {
        if (obj.command === "detailRequest") {
          if (typeof obj.message === "string") {
            await this.setStateAsync(`stations.adapterStatus`, {
              val: "detail request",
              ack: true
            });
            const id = obj.message;
            this.writeLog(
              `[ Adapter V:${this.version} onMessage ] start detailRequest for ${id}`,
              "debug"
            );
            const result = await this.detailRequest(id);
            if (!result) {
              this.writeLog(
                `[ Adapter V:${this.version} onMessage ] detailRequest for ${id} failed`,
                "error"
              );
              await this.setStateAsync(`stations.adapterStatus`, {
                val: "idle",
                ack: true
              });
              if (obj.callback)
                this.sendTo(obj.from, obj.command, "error", obj.callback);
            } else {
              this.writeLog(
                `[ Adapter V:${this.version} onMessage ] detailRequest result: ${JSON.stringify(result)}`,
                "debug"
              );
              await this.setStateAsync(`stations.adapterStatus`, {
                val: "idle",
                ack: true
              });
              if (obj.callback)
                this.sendTo(obj.from, obj.command, result, obj.callback);
            }
          }
        }
      }
    } catch (e) {
      this.writeLog(`Error onMessage: ${e}`, "error");
    }
  }
  async detailRequest(id) {
    try {
      let dataJson = void 0;
      const url = `https://creativecommons.tankerkoenig.de/json/detail.php?id=${id}&apikey=${this.decrypt(
        this.config.apikey
      )}`;
      this.writeLog(`[ Adapter V:${this.version} detailRequest ] url: ${url}`, "debug");
      const config = {
        headers: {
          "User-Agent": `${this.name}/${this.version}`,
          Accept: "application/json"
        },
        timeout: 1e4
      };
      const result = await import_axios.default.get(url, config);
      if (result.status === 200) {
        this.writeLog(
          `[ Adapter V:${this.version} detailRequest axios:${import_axios.default.VERSION} ] detailRequest result: ${JSON.stringify(result.data)}`,
          "debug"
        );
        if (result.data.ok) {
          this.writeLog(
            `[ Adapter V:${this.version} detailRequest axios:${import_axios.default.VERSION} ] detailRequest for ${id} success`,
            "debug"
          );
          this.writeLog(
            `[ Adapter V:${this.version} detailRequest axios:${import_axios.default.VERSION} ] detailRequest for ${id} result: ${JSON.stringify(result.data)}`,
            "debug"
          );
          dataJson = {
            status: result.data.status,
            ok: result.data.ok,
            data: {
              street: result.data.station.street,
              city: result.data.station.place,
              houseNumber: result.data.station.houseNumber,
              postCode: result.data.station.postCode,
              latitude: result.data.station.lat,
              longitude: result.data.station.lng,
              wholeDay: result.data.station.wholeDay,
              openingTimes: result.data.station.openingTimes.length > 0 ? result.data.station.openingTimes : "noData",
              overrides: result.data.station.overrides.length > 0 ? result.data.station.overrides : "noData"
            }
          };
          return dataJson;
        } else {
          this.writeLog(
            `[ Adapter V:${this.version} detailRequest axios:${import_axios.default.VERSION} ] detailRequest for ${id} failed`,
            "error"
          );
          this.writeLog(
            `[ Adapter V:${this.version} detailRequest axios:${import_axios.default.VERSION} ] detailRequest for ${id} result: ${JSON.stringify(result.data)}`,
            "error"
          );
          return result.data;
        }
      }
    } catch (error) {
      if (error.response) {
        if (error.response.status === 503) {
          this.writeLog(
            `[ Adapter V:${this.version} detailRequest axios:${import_axios.default.VERSION} ] Code: ${error.response.status} Message: >> ${error.response.statusText} Rate Limit Exceeded << Data: ${JSON.stringify(error.response.data)}`,
            "error"
          );
        } else {
          this.writeLog(
            `[ Adapter V:${this.version} detailRequest axios:${import_axios.default.VERSION} ] error.response: Code: ${error.response.status}  Message: ${error.response.statusText} Data: ${JSON.stringify(error.response.data)} `,
            "error"
          );
        }
      } else {
        if (error.code === "ECONNABORTED") {
          this.writeLog(
            `[ Adapter V:${this.version} detailRequest axios:${import_axios.default.VERSION} ] error.code: ${error.code} Message: ${error.message}`,
            "error"
          );
          return error;
        } else {
          this.writeLog(
            `[ Adapter V:${this.version} detailRequest axios:${import_axios.default.VERSION} ] Error: ${error} Error Code ${error.code} Error Message ${error.message} >>> Stack: ${error.stack}`,
            "error"
          );
        }
      }
    }
  }
  async onStateChange(id, state) {
    try {
      if (state) {
        if (id === `${this.namespace}.stations.refresh`) {
          if (state.val && !state.ack) {
            if (!this.refreshTimeout) {
              this.writeLog(`refresh timeout set to 1min`, "info");
              this.refreshTimeout = setTimeout(async () => {
                this.writeLog(`refresh again possible`, "info");
                this.refreshTimeout = null;
                this.refreshStatus = false;
              }, 6e4);
            }
            if (!this.refreshStatus) {
              this.refreshStatus = true;
              this.writeLog("manuel refresh the data from tankerkoenig.de", "info");
              await this.setStateAsync(`stations.adapterStatus`, {
                val: "manuel request",
                ack: true
              });
              await this.requestData();
            } else {
              this.writeLog(
                "too short time between manual refreshes, manual request is allowed only once per min.",
                "warn"
              );
              await this.setStateAsync(`stations.adapterStatus`, {
                val: "request timeout 1min",
                ack: true
              });
              if (this.refreshStatusTimeout)
                clearTimeout(this.refreshStatusTimeout);
              this.refreshStatusTimeout = setTimeout(async () => {
                await this.setStateAsync(`stations.adapterStatus`, {
                  val: "idle",
                  ack: true
                });
              }, 1e4);
            }
          }
        }
      }
    } catch (e) {
      this.writeLog(
        `[ Adapter V:${this.version} onStateChange ID: ${id}] error: ${e} , stack: ${e.stack}`,
        "error"
      );
    }
  }
}
if (require.main !== module) {
  module.exports = (options) => new Tankerkoenig(options);
} else {
  (() => new Tankerkoenig())();
}
//# sourceMappingURL=main.js.map
