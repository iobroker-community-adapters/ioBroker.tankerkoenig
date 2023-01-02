# Older changes
## 3.2.4 (2022-12-28)
* (xXBJXx) fixed type "number" but received type "string" [Issue #100](https://github.com/iobroker-community-adapters/ioBroker.tankerkoenig/issues/100)

## 3.2.3 (2022-12-27)
* (xXBJXx) the detailed request for the station data has been removed, see [issue #99](https://github.com/iobroker-community-adapters/ioBroker.tankerkoenig/issues/99)
* (xXBJXx) added new input field for the address of the station in the adapter settings

## 3.2.2 (2022-12-26)
* (xXBJXx) Added encryption of the API key
* (xXBJXx) added better error messages for the data request
* (xXBJXx) dependency update

## 3.2.1 (2022-12-25)
* (xXBJXx) Added opening Times for the gas stations
* (xXBJXx) Renaming function extended

## 3.2.0 (2022-12-24)
* (xXBJXx) added detailed information for the gas stations in the object (street, city, etc.) [issue #98](https://github.com/iobroker-community-adapters/ioBroker.tankerkoenig/issues/98)
* (xXBJXx) added address information for the gas stations in the object Name (Shell (Musterstraße 1, 12345 Musterstadt))

## 3.1.0 (2022-11-27)
* (xXBJXx) removed noLog option because the adapter log output was strongly optimized
* (xXBJXx) Optimized sorting of the cheapest gas station [issue #96](https://github.com/iobroker-community-adapters/ioBroker.tankerkoenig/issues/96)
* (xXBJXx) add new state `cheapest_stations` for the cheapest gas station [issue #93](https://github.com/iobroker-community-adapters/ioBroker.tankerkoenig/issues/93)

## 3.0.6 (2022-11-23)
* (xXBJXx) Added new option to adjust the text in the combined data point [issue #95](https://github.com/iobroker-community-adapters/ioBroker.tankerkoenig/issues/95)

## 3.0.5 (2022-11-20)
* (xXBJXx) fixed sort bug for cheapest station

## 3.0.4 (2022-11-19)
* (xXBJXx) moved misc-data type to vehicle type
* (xXBJXx) fixed messages rules and added new messages for Adapter Update
* (xXBJXx) update dependencies
* (xXBJXx) added lastUpdate_min / lastUpdate_max DP [issue #91](https://github.com/iobroker-community-adapters/ioBroker.tankerkoenig/issues/91)

## 3.0.3 (2022-11-18)
* (xXBJXx) Ukrainian translation added
* (xXBJXx) add validation function for ID and Name Input fields
* (xXBJXx) add copy from clipboard function for ID Input field
* (Schmakus) added daily min/max prices to all stations and fuel types
* (xXBJXx) update documentation because of new min/max datapoints

## 3.0.2 (2022-11-10)
* (xXBJXx) release new version from Tankerkoenig

## 3.0.1 (2022-07-30)
* (xXBJXx) resetValue function removed and state quality implemented. [issue #79](https://github.com/iobroker-community-adapters/ioBroker.tankerkoenig/issues/79)
* (xXBJXx) added function => Set values to 0 when the Station is closed.
* (xXBJXx) updated dependencies

## 3.0.0 (2022-07-02)
* (xXBJXx) BREAKING Adapter code completely revised
* (xXBJXx) Adapter completely switched to TypeScript
* (xXBJXx) BREAKING Adapter configurations page switched to React and redesigned
  (old config not compatible stations must be recreated)
* (xXBJXx) add Dependabot auto merge support
* (xXBJXx) add test and release script 
* (xXBJXx) Dependency updated
* (xXBJXx) add feature request: manual update of all stations (one request per minute allowed) [issue #53](https://github.com/iobroker-community-adapters/ioBroker.tankerkoenig/issues/53) 
* (xXBJXx) add a new state => adapterStatus (indicates whether the adapter executes an automatic request or a manual request)
* (xXBJXx) add new cutPrice function [issue #73](https://github.com/iobroker-community-adapters/ioBroker.tankerkoenig/issues/73)
* (xXBJXx) add the feature request: Include discount in price (euro and percent) [issue #50](https://github.com/iobroker-community-adapters/ioBroker.tankerkoenig/issues/50) and adapter code optimized
* (xXBJXx) add the feature request: JsonTable for the vis [issue #24](https://github.com/iobroker-community-adapters/ioBroker.tankerkoenig/issues/24)

## 2.2.0 (2021-11-14)
* (simatec) Design Fix for Admin Dark/Blue Theme

### 2.1.1 (2021-06-22)
* (pix) New adapter category "vehicle" [#67](https://github.com/iobroker-community-adapters/ioBroker.tankerkoenig/issues/67)
* (pix) Testing for Nodejs 16

### 2.0.12 (2021-05-05)
* (pix) connectionType and dataSource added

### 2.0.11 (2021-05-02)
* (anwa) "wrong type" and "ack flag" issues fixed (upcoming in js-controller > 3.3)

### 2.0.10 (2021-02-01)
* (wendy) "has no existing object" issue fixed

### 2.0.9 (2020-04-21)
* (pix) NodeJS 10 or higher required

### 2.0.8 (2020-03-27)
* (Zwer2k) 2.0.8 Catch error if station status reports _no data_

### 2.0.7 (2020-03-25)
* (pix) 2.0.7 Catch error if station status reports _no stations_

### 2.0.6 (2019-04-17)
* (Zwer2k) implementation of utils corrected
* (Zwer2k) fixed error occured when all stations were closed

### 2.0.5 (2019-02-22)
* (jens-maus) fixes to prevent _request()_ floodings

### 2.0.3 (2019-02-21)
* (pix) fixed issue with too short sync interval
* (pix) removed datapoint __price__ which was created for debug only

### 2.0.1 (2019-02-20)
* (pix) fixed scrollbar issue in firefox

### 2.0.0 (2019-02-18)
* (pix) admin3 ready

### 1.3.1 (2019-02-05)
* (arteck, pix) request issues fixed

### 1.3.0 (2019-02-05)
* (pix) Compact mode added

### 1.2.1 (2018-11-25)
* (pix) fixed issue __station_id__ and __status__ mixed up

### 1.2.0 (2018-11-25)
* (pix) new datapoint station ID added

### 1.1.0 (2018-05-12)
* (bluefox) prices as number to allow logging were added

### 1.0.5 (2018-02-07)
* (pix) Log entry opt out

### 1.0.4 (2017-03-21)
* (pix) position of _adapter.stop()_ optimized

### 1.0.3 (2017-01-05)
* (pix) Appveyor testing added

### 1.0.2 (2017-01-04)
* (apollon77) TravisCI testing added

### 1.0.1 (2016-12-20)
* (pix) reset to zero issue fixed

### 1.0.0 (2016-10-08)
* (pix) reset values to zero before each refresh now can be ticked off.

### 0.1.2 (2016-07-05)
* (pix,jens-maus) whitespaces between price and € sign

### 0.1.1 (2016-07-05)
* (pix) € appearance in datapoints __combined__ is customizable through css now (thanx jens-maus)

### 0.1.0 (2016-06-12)
* (pix) first version for npm
* (pix) settings window

### 0.0.8 (2016-06-09)
* (pix) Adapter.stop() fixed

### 0.0.7 (2016-06-09)
* (pix) New channels and values for cheapest station created

### 0.0.6 (2016-06-08)
* (pix) Short prices now string

### 0.0.5 (2016-06-08)
* (pix) Channels added for stations 2 to 10
* (pix) Readme corrected (CSS code example)
* (pix) no more log.warn if station is closed
* (pix) scheduled starting improved

### 0.0.4 (2016-06-01)
* (pix) HTML Code in Datapoint __combined__ corrected

### 0.0.3 (2016-06-01)
* (pix) Datapoint __combined__ with CSS class for status

### 0.0.2 (2016-06-01)
* (pix) Datapoint __combined__

### 0.0.1 (2016-05-31)
* (pix) Adapter created