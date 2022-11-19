![Logo](admin/tankerkoenig.png)
# ioBroker.tankerkoenig

![Number of Installations](http://iobroker.live/badges/tankerkoenig-installed.svg) 
![Number of Installations](http://iobroker.live/badges/tankerkoenig-stable.svg) 
[![NPM version](http://img.shields.io/npm/v/iobroker.tankerkoenig.svg)](https://www.npmjs.com/package/iobroker.tankerkoenig)
[![Downloads](https://img.shields.io/npm/dm/iobroker.tankerkoenig.svg)](https://www.npmjs.com/package/iobroker.tankerkoenig)

[![NPM](https://nodei.co/npm/iobroker.tankerkoenig.png?downloads=true)](https://nodei.co/npm/iobroker.tankerkoenig/)


NodeJS v14 or higher is required.

## Documentation
:de: [Dokumentation](/docs/de/doc_tankerkoenig_de.md)

:uk: [Documentation](/docs/en/doc_tankerkoenig_en.md)


## Changelog
 <!--
 Release Script: https://github.com/AlCalzone/release-script
 Placeholder for the next version (at the beginning of the line):
 ### __WORK IN PROGRESS__ (- falls nicht benötigt löschen sonst klammern entfernen und nach dem - dein text schreiben)
 -->
### 3.0.3 (2022-11-18)
* (xXBJXx) Ukrainian translation added
* (xXBJXx) add validation function for ID and Name Input fields
* (xXBJXx) add copy from clipboard function for ID Input field
* (Schmakus) added daily min/max prices to all stations and fuel types
* (xXBJXx) update documentation because of new min/max datapoints

### 3.0.2 (2022-11-10)
* (xXBJXx) release new version from Tankerkoenig

### 3.0.1 (2022-07-30)
* (xXBJXx) resetValue function removed and state quality implemented. [issue #79](https://github.com/iobroker-community-adapters/ioBroker.tankerkoenig/issues/79)
* (xXBJXx) added function => Set values to 0 when the Station is closed.
* (xXBJXx) updated dependencies

### 3.0.0 (2022-07-02)
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

### 2.2.0 (2021-11-14)
* (simatec) Design Fix for Admin Dark/Blue Theme

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
