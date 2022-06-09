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
  priceObj: () => priceObj,
  statesObj: () => statesObj
});
module.exports = __toCommonJS(object_definition_exports);
const statesObj = {
  status: {
    type: "state",
    common: {
      name: "Status",
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
      name: "Name",
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  priceObj,
  statesObj
});
//# sourceMappingURL=object_definition.js.map
