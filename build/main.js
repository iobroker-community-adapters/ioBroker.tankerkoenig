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
class Tankerkoenig extends utils.Adapter {
  constructor(options = {}) {
    super({
      ...options,
      name: "tankerkoenig"
    });
    this.on("ready", this.onReady.bind(this));
    this.on("stateChange", this.onStateChange.bind(this));
    this.on("unload", this.onUnload.bind(this));
    this.fuelTypes = ["e5", "e10", "diesel"];
    this.sync_milliseconds = 5 * 60 * 1e3;
    this.refreshStatus = false;
    this.requestTimeout = null;
    this.refreshTimeout = null;
    this.refreshStatusTimeout = null;
  }
  async onReady() {
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
    if (isNaN(this.sync_milliseconds) || this.sync_milliseconds < 5 * 60 * 1e3) {
      this.sync_milliseconds = 3e5;
      this.writeLog(
        `Sync time was too short (${this.config.synctime}). New sync time is 5 min`,
        "warn"
      );
    }
    this.writeLog(
      `Sync time set to ${this.config.synctime} minutes or ${this.sync_milliseconds} ms`,
      "info"
    );
    this.sync_milliseconds += Math.floor(Math.random() * 100);
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
      if (this.requestTimeout)
        clearTimeout(this.requestTimeout);
      this.writeLog(`request start now`, "debug");
      const url = `https://creativecommons.tankerkoenig.de/json/prices.php?ids=${this.config.station.map((station) => station.station).join(",")}&apikey=${this.config.apikey}`;
      await import_axios.default.get(url, {
        headers: {
          "User-Agent": `${this.name} ${this.version}`,
          "Accept-Encoding": "identity",
          Accept: "application/json"
        }
      }).then(async (response) => {
        console.log(`axios response data:`, response);
        if (response.status === 200) {
          this.writeLog(
            `type response: ${typeof response.data} >>> ${JSON.stringify(response.data)}`,
            "debug"
          );
          console.log(
            `type response: ${typeof response.data} >>> ${JSON.stringify(response.data)}`
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
          }
        }
      }).catch(async (error) => {
        this.writeLog(`Error: ${error.message} >>> Stack: ${error.stack}`, "error");
        await this.setStateAsync(`stations.adapterStatus`, {
          val: "request Error",
          ack: true
        });
      });
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
      this.writeLog(`requestData error: ${error} stack: ${error.stack}`, "error");
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
      this.writeLog(`setDiscount error: ${error} stack: ${error.stack}`, "error");
      return price;
    }
  }
  async oldState(id) {
    try {
      const oldState = await this.getStateAsync(id);
      return oldState ? oldState.val : null;
    } catch (error) {
      this.writeLog(`[ oldState ] error: ${error} stack: ${error.stack}`, "error");
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
      this.writeLog(`[ oldState ] error: ${error} stack: ${error.stack}`, "error");
      return null;
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
      for (const filterE5Key in filterE5) {
        if (filterE5.hasOwnProperty(filterE5Key)) {
          for (const stationKey in station) {
            if (station.hasOwnProperty(stationKey)) {
              if (filterE5[filterE5Key].station === station[stationKey].station) {
                allCheapestE5.push({ name: station[stationKey].stationname });
              }
            }
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
              }
            }
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
              }
            }
          }
        }
      }
      this.writeLog(`allCheapestDiesel: ${JSON.stringify(allCheapestDiesel)}`, "debug");
      for (const [key, stationValue] of Object.entries(station)) {
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
                    ) || feed_min === 0) && (feed_min !== void 0 || feed_min !== null)) {
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
                    ) || feed_max === 0) && (feed_max !== void 0 || feed_max !== null)) {
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
                    await this.setStateAsync(
                      `stations.${key}.${this.fuelTypes[fuelTypesKey]}.short`,
                      {
                        val: short.toString(),
                        ack: true,
                        q: 64
                      }
                    );
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
      this.writeLog(`writeState error: ${error} stack: ${error.stack}`, "error");
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
              jsonTable.push({
                station: station[key].stationname,
                status,
                e5: pricesValue.e5,
                e10: pricesValue.e10,
                diesel: pricesValue.diesel,
                discount: station[key].discounted ? station[key].discountObj.discountType === "percent" ? `${station[key].discountObj.discount}%` : `${station[key].discountObj.discount}\u20AC` : "0"
              });
            }
          }
        }
      }
      return jsonTable;
    } catch (error) {
      this.writeLog(`createJsonTable error: ${error} stack: ${error.stack}`, "error");
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
        this.writeLog(
          `return Price with discount ${price - parseFloat(newPrice.toFixed(2))}`,
          "debug"
        );
        return price - parseFloat(newPrice.toFixed(2));
      } else if (discountType === "absolute") {
        this.writeLog(`discount in absolute: ${discount}`, "debug");
        this.writeLog(`return Price with discount ${price - discount}`, "debug");
        return parseFloat(parseFloat(String(price - discount)).toFixed(3));
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
      await this.setObjectNotExistsAsync("stations.cheapest", {
        type: "channel",
        common: {
          name: "Cheapests gas stations"
        },
        native: {}
      });
      for (const fuelTypesKey in this.fuelTypes) {
        if (this.fuelTypes.hasOwnProperty(fuelTypesKey)) {
          await this.setObjectNotExistsAsync(`stations.cheapest.${this.fuelTypes[fuelTypesKey]}`, {
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
              await this.setObjectNotExistsAsync(
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
              await this.setObjectNotExistsAsync(
                `stations.cheapest.${this.fuelTypes[fuelTypesKey]}.${statesObjKey}`,
                import_object_definition.statesObj[statesObjKey]
              );
              for (const priceObjKey in import_object_definition.priceObj) {
                if (import_object_definition.priceObj.hasOwnProperty(priceObjKey)) {
                  await this.setObjectNotExistsAsync(
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
      for (const stationKey in stations) {
        if (parseFloat(stationKey) <= 9) {
          if (stations.hasOwnProperty(stationKey)) {
            const station = stations[stationKey];
            await this.setObjectNotExistsAsync(`stations.${stationKey}`, {
              type: "channel",
              common: {
                name: station.stationname !== "" ? station.stationname : `station ${stationKey}`
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
                    name: station.stationname !== "" ? station.stationname : `station ${stationKey}`
                  },
                  native: {}
                });
              }
            }
            for (const fuelTypesKey in this.fuelTypes) {
              if (this.fuelTypes.hasOwnProperty(fuelTypesKey)) {
                await this.setObjectNotExistsAsync(
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
                await this.setObjectNotExistsAsync(
                  `stations.${stationKey}.${statesObjKey}`,
                  import_object_definition.statesObj[statesObjKey]
                );
              }
            }
            for (const fuelTypesKey in this.fuelTypes) {
              for (const priceObjKey in import_object_definition.priceObj) {
                if (import_object_definition.priceObj.hasOwnProperty(priceObjKey)) {
                  await this.setObjectNotExistsAsync(
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
              await this.setObjectNotExistsAsync(
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
                  await this.setObjectNotExistsAsync(
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
      await this.setObjectNotExistsAsync(`stations.jsonTable`, {
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
      this.log.error(`writeLog error: ${error} , stack: ${error.stack}`);
    }
  }
  async onUnload(callback) {
    try {
      if (this.requestTimeout)
        clearInterval(this.requestTimeout);
      if (this.refreshTimeout)
        clearInterval(this.refreshTimeout);
      if (this.refreshStatusTimeout)
        clearTimeout(this.refreshStatusTimeout);
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
