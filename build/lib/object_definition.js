"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var object_definition_exports = {};
__export(object_definition_exports, {
  cheapestObj: () => cheapestObj,
  priceMinMaxObj: () => priceMinMaxObj,
  priceObj: () => priceObj,
  statesObj: () => statesObj
});
module.exports = __toCommonJS(object_definition_exports);
const statesObj = {
  status: {
    type: "state",
    common: {
      name: "Station Status",
      type: "string",
      role: "text",
      def: "",
      read: true,
      write: false
    },
    native: {}
  },
  name: {
    type: "state",
    common: {
      name: "Station Name",
      type: "string",
      role: "text",
      def: "",
      read: true,
      write: false
    },
    native: {}
  },
  station_id: {
    type: "state",
    common: {
      name: "Station ID",
      type: "string",
      role: "text",
      def: "",
      read: true,
      write: false
    },
    native: {}
  },
  discounted: {
    type: "state",
    common: {
      name: "Discount active",
      desc: "Shows whether the discount is activated at this station",
      type: `boolean`,
      role: `indicator`,
      def: false,
      read: true,
      write: false
    },
    native: {}
  },
  discount: {
    type: "state",
    common: {
      name: "Discount",
      desc: "Shows the discount at this station",
      type: `number`,
      role: `value`,
      def: 0,
      read: true,
      write: false
    },
    native: {}
  }
};
const cheapestObj = {
  cheapest_stations: {
    type: "state",
    common: {
      name: "all Cheapest Stations",
      desc: "all Cheapest Stations as Array",
      type: "string",
      role: "json",
      def: "",
      read: true,
      write: false
    },
    native: {}
  }
};
const priceObj = {
  "3rd": {
    type: "state",
    common: {
      type: "number",
      role: "state",
      def: 0,
      read: true,
      write: false
    },
    native: {}
  },
  combined: {
    type: "state",
    common: {
      type: "string",
      role: "text",
      def: "",
      read: true,
      write: false
    },
    native: {}
  },
  feed: {
    type: "state",
    common: {
      type: "number",
      role: "state",
      def: 0,
      unit: "\u20AC",
      read: true,
      write: false
    },
    native: {}
  },
  short: {
    type: "state",
    common: {
      type: "string",
      role: "text",
      def: "",
      unit: "\u20AC",
      read: true,
      write: false
    },
    native: {}
  }
};
const priceMinMaxObj = {
  "3rd_min": {
    type: "state",
    common: {
      type: "number",
      role: "state",
      def: 0,
      read: true,
      write: false
    },
    native: {}
  },
  "3rd_max": {
    type: "state",
    common: {
      type: "number",
      role: "state",
      def: 0,
      read: true,
      write: false
    },
    native: {}
  },
  combined_min: {
    type: "state",
    common: {
      type: "string",
      role: "text",
      def: "",
      read: true,
      write: false
    },
    native: {}
  },
  combined_max: {
    type: "state",
    common: {
      type: "string",
      role: "text",
      def: "",
      read: true,
      write: false
    },
    native: {}
  },
  short_min: {
    type: "state",
    common: {
      type: "string",
      role: "text",
      def: "",
      unit: "\u20AC",
      read: true,
      write: false
    },
    native: {}
  },
  short_max: {
    type: "state",
    common: {
      type: "string",
      role: "text",
      def: "",
      unit: "\u20AC",
      read: true,
      write: false
    },
    native: {}
  },
  feed_min: {
    type: "state",
    common: {
      type: "number",
      role: "state",
      def: 0,
      unit: "\u20AC",
      read: true,
      write: false
    },
    native: {}
  },
  feed_max: {
    type: "state",
    common: {
      type: "number",
      role: "state",
      def: 0,
      unit: "\u20AC",
      read: true,
      write: false
    },
    native: {}
  },
  lastUpdate_min: {
    type: "state",
    common: {
      type: `number`,
      role: `value.time`,
      def: 0,
      read: true,
      write: false
    },
    native: {}
  },
  lastUpdate_max: {
    type: "state",
    common: {
      type: `number`,
      role: `value.time`,
      def: 0,
      read: true,
      write: false
    },
    native: {}
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  cheapestObj,
  priceMinMaxObj,
  priceObj,
  statesObj
});
//# sourceMappingURL=object_definition.js.map
