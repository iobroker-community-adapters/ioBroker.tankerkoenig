![Logo](admin/tankerkoenig.png)
# ioBroker.tankerkoenig

![Number of Installations](http://iobroker.live/badges/tankerkoenig-installed.svg) 
![Number of Installations](http://iobroker.live/badges/tankerkoenig-stable.svg) 
[![NPM version](http://img.shields.io/npm/v/iobroker.tankerkoenig.svg)](https://www.npmjs.com/package/iobroker.tankerkoenig)
[![Downloads](https://img.shields.io/npm/dm/iobroker.tankerkoenig.svg)](https://www.npmjs.com/package/iobroker.tankerkoenig)

[![NPM](https://nodei.co/npm/iobroker.tankerkoenig.png?downloads=true)](https://nodei.co/npm/iobroker.tankerkoenig/)


NodeJS v14 or higher is required.

## Update from 2.x.x to 3.0.x English
There are 2 variants:
1. uninstall adapter completely and reinstall (recommended) Procedure:
   1. you go to the Adapter UI and save your `API-Key` and if you want the `Stadium ID`.
   2. you go to the tab Adapter and uninstall the adapter (**Attention** all data points will be deleted)\
   if you log data points (e.g. with InfluxDB) you have to enable them again afterwards\
   ![uninstalls](docs/img/uninstalls.png)
   3. you install the new adapter
   4. you enter your API key again
   5. you create the stations again\
   <br>
2. you make an update to the 3.x.x version Procedure:
   1. you go to the Adapter UI and save your `stations IDs` if you want to do it.
   2. you go to the Adapter tab and make an update to the 3.x.x version
   3. you go into the objects and search for `tankerkoenig.0.stations` and delete these objects **Attention** your loggers\
   (e.g. InfluxDB etc.) will be deleted if you use\
   them, they can be reactivated after creating the new datapoints on the\
   new objects and the data will still be logged
   4. you go to the Adapter UI and create the new stations.
   5. you go to the Instances tab and start the adapter creates the objects again now you only have to reactivate\
   the data points that were logged before.


## Update von 2.x.x auf 3.0.x Deutsch
Es gibt 2 Varianten:
1. Deinstalliere den Adapter komplett und installiere ihn neu (empfohlen) Vorgehensweise:
	1. du gehst zur Adapter UI und speicherst deinen `API-Key` und wenn du willst die `Stadium ID`.
	2. du gehst auf den Reiter Adapter und deinstallierst den Adapter (**Achtung** alle Datenpunkte werden gelöscht)\
	   wenn du Datenpunkte protokollierst (z.B. mit InfluxDB), musst du sie anschließend wieder aktivieren\
	   ![uninstalls](docs/img/uninstalls.png)
	3. du installierst den neuen Adapter
	4. Du gibst deinen API-Schlüssel erneut ein
	5. Du erstellst die Stationen erneut.\
	   <br>
2. Du machst ein Update auf die Version 3.x.x Vorgehensweise:
	1. du gehst zur Adapter UI und speicherst deine `Stations IDs`, wenn du das möchtest.
	2. Du gehst auf die Registerkarte "Adapter" und machst ein Update auf die Version 3.x.x.
	3. du gehst in die Objekte und suchst nach `tankerkoenig.0.stations` und löschst diese Objekte **Achtung** deine Logger\
	   (z.B. InfluxDB etc.) werden auch gelöscht, wenn du sie benutzt, sie können nach dem Erstellen der neuen Datenpunkte auf den\
	   neuen Objekten wieder aktiviert werden und die Daten werden weiterhin geloggt
	4. Du gehst zum Adapter UI und erstellst die neuen Stationen.
	5. Du gehst zur Registerkarte Instanzen und startest den Adapter. Der Adapter erstellt die Objekte erneut, \
	   jetzt musst du nur noch die Datenpunkte neu aktivieren, die vorher geloggt wurden.

## Documentation
:de: [Dokumentation](/docs/de/doc_tankerkoenig_de.md)

:uk: [Documentation](/docs/en/doc_tankerkoenig_en.md)

## Changelog
 <!--
 Release Script: https://github.com/AlCalzone/release-script
 Placeholder for the next version (at the beginning of the line):
 ### __WORK IN PROGRESS__ (- falls nicht benötigt löschen sonst klammern entfernen und nach dem - dein text schreiben)
 -->
### 3.1.0 (2022-11-27)
* (xXBJXx) removed noLog option because the adapter log output was strongly optimized
* (xXBJXx) Optimized sorting of the cheapest gas station [issue #96](https://github.com/iobroker-community-adapters/ioBroker.tankerkoenig/issues/96)
* (xXBJXx) add new state `cheapest_stations` for the cheapest gas station [issue #93](https://github.com/iobroker-community-adapters/ioBroker.tankerkoenig/issues/93)

### 3.0.6 (2022-11-23)
* (xXBJXx) Added new option to adjust the text in the combined data point [issue #95](https://github.com/iobroker-community-adapters/ioBroker.tankerkoenig/issues/95)

### 3.0.5 (2022-11-20)
* (xXBJXx) fixed sort bug for cheapest station

### 3.0.4 (2022-11-19)
* (xXBJXx) moved misc-data type to vehicle type
* (xXBJXx) fixed messages rules and added new messages for Adapter Update
* (xXBJXx) update dependencies
* (xXBJXx) added lastUpdate_min / lastUpdate_max DP [issue #91](https://github.com/iobroker-community-adapters/ioBroker.tankerkoenig/issues/91)

### 3.0.3 (2022-11-18)
* (xXBJXx) Ukrainian translation added
* (xXBJXx) add validation function for ID and Name Input fields
* (xXBJXx) add copy from clipboard function for ID Input field
* (Schmakus) added daily min/max prices to all stations and fuel types
* (xXBJXx) update documentation because of new min/max datapoints

## License

The MIT License (MIT)

Copyright (c) 2016-2022 xXBJXx <issi.dev.iobroker@gmail.com> pix

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
