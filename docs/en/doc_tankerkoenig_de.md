![Logo](../../admin/tankerkoenig.png)
# ioBroker.tankerkoenig

[![NPM version](http://img.shields.io/npm/v/iobroker.tankerkoenig.svg)](https://www.npmjs.com/package/iobroker.tankerkoenig)
[![Downloads](https://img.shields.io/npm/dm/iobroker.tankerkoenig.svg)](https://www.npmjs.com/package/iobroker.tankerkoenig)
[![Open Issues](http://githubbadges.herokuapp.com/Pix---/ioBroker.tankerkoenig/issues.svg)](http://github.com/Pix---/ioBroker.tankerkoenig/issues)

[![NPM](https://nodei.co/npm/iobroker.tankerkoenig.png?downloads=true)](https://nodei.co/npm/iobroker.tankerkoenig/)

**Tests:** Linux/Mac: [![Travis-CI](http://img.shields.io/travis/Pix---/ioBroker.tankerkoenig/master.svg)](https://travis-ci.org/Pix---/ioBroker.tankerkoenig)
Windows: [![AppVeyor](https://ci.appveyor.com/api/projects/status/github/Pix---/ioBroker.tankerkoenig?branch=master&svg=true)](https://ci.appveyor.com/project/Pix---/ioBroker-tankerkoenig/)


## Description
:en: This adapter returns fuel prices for up to ten different station through a JSON feed of the web service [tankerkoenig.de](https://creativecommons.tankerkoenig.de/#about). All data is stored in objects to be used and displayed in [ioBroker.vis](https://github.com/ioBroker/ioBroker.vis).
The adapter uses the site prices.php which reduces the amount of data to be transfered when updating compared to list.php and detail.php (bulk). The adapter creates datapoints for the station that sells the cheapest E5, E10 and diesel.

## Configuration
### API key
The API key can be obtained at [website Tankerkönig](https://creativecommons.tankerkoenig.de/#about). It is a 36 digit code that has to be entered in this field.

### Stations
Up to ten different stations can be defined. Therefore the specific station ID can be obtained on tankerkoenig.de. It has 36 digits too. This ID has to be entered in the list. A corresponding name is optional.
![alt text](img/tankerkoenigSettingsScreenshot.jpg "Screenshot Settings")

### Write null
In case of a disconnect this option prevents the adapter to store old values. It helps to produce a smoother history chart.

### Minimize log
To reduce log writing (e.g. on SD cards) this option can be selected.

## Activation / schedule
The adapter starts every five minutes. Tankerkoenig.de updates their data from only every four minutes. 

##  Datapoints
Each of the ten ten stations have a channel for each fuel type (E5, E10 and diesel) and furthermore each of them has another four datapoints.
* feed (price with three decimals; type number)
* short (price with two decimals; type string)
* 3rd (third decimal cann be writen as superscript in VIS)
* combined (ready to use HTML formatted price with a superscripted third decimal and info, whether station is open ["closed"/"not found"] to be displayed in a VIS HTML Widget)
![alt text](img/tankerkoenigDP.jpg "Datapoints")

Three more datapoints are stored
* status (sation open/closed)
* name (user given name of the station)
* station_id (Tankerkönig ID of that station)

Additionally the cheapest stations for each fule type are stored
* 'cheapest.E5'
* 'chepest.E10'
* 'cheapest.diesel'

Within these channels the station with the lowest price for each fule type are stored. In case multiple stations offer the same lowest price, stations a sorted in the order that has been used in the configuration.

181 datapoints are created.

## VIS 
The datapoint 'combined' can be displayed easily in this VIS widget
```
[{"tpl":"tplHtml","data":{"visibility-cond":"==","visibility-val":1,"refreshInterval":"0","gestures-offsetX":0,"gestures-offsetY":0,"signals-cond-0":"==","signals-val-0":true,"signals-icon-0":"/vis/signals/lowbattery.png","signals-icon-size-0":0,"signals-blink-0":false,"signals-horz-0":0,"signals-vert-0":0,"signals-hide-edit-0":false,"signals-cond-1":"==","signals-val-1":true,"signals-icon-1":"/vis/signals/lowbattery.png","signals-icon-size-1":0,"signals-blink-1":false,"signals-horz-1":0,"signals-vert-1":0,"signals-hide-edit-1":false,"signals-cond-2":"==","signals-val-2":true,"signals-icon-2":"/vis/signals/lowbattery.png","signals-icon-size-2":0,"signals-blink-2":false,"signals-horz-2":0,"signals-vert-2":0,"signals-hide-edit-2":false,"html":"<span style=\"font-size: 80%; padding: 0 20px 0 5px;\">Diesel</span>{tankerkoenig.0.stations.0.diesel.combined}"},"style":{"left":"634px","top":"745px","z-index":"20","width":"228px","height":"36px","background-color":"","color":"rgba(225,225,225,1)","font-size":"30px","text-align":"center","background":"rgba(250,0,0,0.1)"},"widgetSet":"basic"}]
```
The value of the datapoint 'combined' deliveres a css class. These classes are 'station_open', 'station_closed' and 'station_notfound'. Through CSS definitions in the CSS editor in VIS now distinguished designs can be achieved (like red font color for a closed station).
```
.station_open {
    color: blue; 
}
.station_closed {
    color: red !important; /* !important kann ggf. weggelassen werden */
}
.station_notfound {
    color: yellow !important; /* !important kann ggf. weggelassen werden */
}

/* € sign */
.station_combined_euro {
    font-family: Times;
    font-size: 80%;
}
```
