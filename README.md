![Logo](admin/tankerkoenig.png)
# ioBroker.tankerkoenig

![Number of Installations](http://iobroker.live/badges/tankerkoenig-installed.svg)
![ioBroker stable release](http://iobroker.live/badges/tankerkoenig-stable.svg)
[![NPM version](http://img.shields.io/npm/v/iobroker.tankerkoenig.svg?logo=npm)](https://www.npmjs.com/package/iobroker.tankerkoenig)
[![Downloads](https://img.shields.io/npm/dm/iobroker.tankerkoenig.svg?logo=npm)](https://www.npmjs.com/package/iobroker.tankerkoenig)
[![Test and Release](https://github.com/iobroker-community-adapters/ioBroker.tankerkoenig/actions/workflows/test-and-release.yml/badge.svg)](https://github.com/iobroker-community-adapters/ioBroker.tankerkoenig/actions/workflows/test-and-release.yml)

**This adapter uses Sentry libraries to automatically report exceptions and code errors to the developers.** For more details and for information how to disable the error reporting see [Sentry-Plugin Documentation](https://github.com/ioBroker/plugin-sentry#plugin-sentry)! Sentry reporting is used starting with js-controller 3.0.

NodeJS v14 or higher is required.

## Migration Guides
[Migration guide to 3.3.x](docs/guide/migration_3.3.x.md)\
[Migration guide to 3.1.x](docs/guide/migration_3.1.x.md)

## Documentation
:de: [Dokumentation](/docs/de/doc_tankerkoenig_de.md)

:uk: [Documentation](/docs/en/doc_tankerkoenig_en.md)

## Changelog
 <!--
 Release Script: https://github.com/AlCalzone/release-script
 Placeholder for the next version (at the beginning of the line):
 ### __WORK IN PROGRESS__ (- falls nicht benötigt löschen sonst klammern entfernen und nach dem - dein text schreiben)
 -->
### __WORK IN PROGRESS__
* (xXBJXx) fixed => adapter does not fetch data after a `requestData error` e.g. internet termination.
* (xXBJXx) add adapter migration Guide from 3.1.x to 3.3.x or 3.2.x to 3.3.x [Migration guide](docs/guide/migration_3.3.x.md)

### 3.3.2 (2023-01-02)
* (xXBJXx) fixed TypeError: Cannot read property 'length' of undefined in addDiscount when the value is `boolean / undefined`
* (xXBJXx) fixed Error: DB closed when the adapter is stopped
* (xXBJXx) object creation optimized
* (xXBJXx) request interval default value changed to 10 minutes and minimum value to 10 minutes
* (xXBJXx) added a check for the Station ID is already configured (in edit mode)
* (xXBJXx) added price difference to the last price
* (xXBJXx) added a feature request cheapest station [Issue #109](https://github.com/iobroker-community-adapters/ioBroker.tankerkoenig/issues/109)

### 3.3.1 (2022-12-30)
* (xXBJXx) fixed TypeError: Cannot read properties of undefined [Issue #104](https://github.com/iobroker-community-adapters/ioBroker.tankerkoenig/issues/104)
* (xXBJXx) added full street state for each station

### 3.3.0 (2022-12-29)
* (Apollon77) Added Sentry for crash reporting
* (xXBJXx) Added detailed request when creating stations in the UI

### 3.2.5 (2022-12-28)
* (xXBJXx) Problem with entering the postal code in the UI fixed

### 3.2.4 (2022-12-28)
* (xXBJXx) fixed type "number" but received type "string" [Issue #100](https://github.com/iobroker-community-adapters/ioBroker.tankerkoenig/issues/100)

## License

The MIT License (MIT)

Copyright (c) 2016-2023 xXBJXx <issi.dev.iobroker@gmail.com> pix

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