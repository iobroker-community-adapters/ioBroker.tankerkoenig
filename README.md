![Logo](admin/tankerkoenig.png)
# ioBroker.tankerkoenig

![Number of Installations](http://iobroker.live/badges/tankerkoenig-installed.svg)
![ioBroker stable release](http://iobroker.live/badges/tankerkoenig-stable.svg)
[![NPM version](http://img.shields.io/npm/v/iobroker.tankerkoenig.svg?logo=npm)](https://www.npmjs.com/package/iobroker.tankerkoenig)
[![Downloads](https://img.shields.io/npm/dm/iobroker.tankerkoenig.svg?logo=npm)](https://www.npmjs.com/package/iobroker.tankerkoenig)
[![Test and Release](https://github.com/iobroker-community-adapters/ioBroker.tankerkoenig/actions/workflows/test-and-release.yml/badge.svg)](https://github.com/iobroker-community-adapters/ioBroker.tankerkoenig/actions/workflows/test-and-release.yml)

**This adapter uses Sentry libraries to automatically report exceptions and code errors to the developers.** For more details and for information how to disable the error 
reporting see [Sentry-Plugin Documentation](https://github.com/ioBroker/plugin-sentry#plugin-sentry)! Sentry reporting is used starting with js-controller 3.0. 

NodeJS v14 or higher is required.

## Migration Guides
[Migration guide 3.3.3 to 3.3.5](docs/guide/migration_3.3.5.md)\
[Migration guide 3.1.x to 3.3.x or 3.2.x to 3.3.x](docs/guide/migration_3.3.x.md)\
[Migration guide 2.x.x to 3.3.x](docs/guide/migration_2.x.x_to_3.3.x.md)

## Documentation
:de: [Dokumentation](/docs/de/doc_tankerkoenig_de.md)

:uk: [Documentation](/docs/en/doc_tankerkoenig_en.md)

## Changelog
<!--
    ### **WORK IN PROGRESS**
-->
### 3.4.0 (2024-04-28)
* (mcm1957) Adapter requires node.js 18 and js-controller >= 5 now
* (mcm1957) Dependencies have been updated

### 3.3.7 (2023-02-06)
* (xXBJXx) added difference to jsonTable [issue #116](https://github.com/iobroker-community-adapters/ioBroker.tankerkoenig/issues/116)
* (xXBJXx) added a log message for the error `parameter error`
* (xXBJXx) set the name length to 34 characters
* (xXBJXx) Added verification if the api key is encrypted
* (xXBJXx) updated the Dependencies

### 3.3.6 (2023-01-22)
* (xXBJXx) fixed position of the warning message in the UI
* (xXBJXx) updated the documentation and migration guides for stable version 3.3.6

### 3.3.5 (2023-01-04)
* (xXBJXx) fixed copy/paste bug in the UI

### 3.3.4 (2023-01-03)
* (xXBJXx) Fixed an issue where a postal code starting with 0 was not displayed correctly [Issue #113](https://github.com/iobroker-community-adapters/ioBroker.tankerkoenig/issues/113)

## License

The MIT License (MIT)

Copyright (c) 2024 iobroker-community-adapters <iobroker-community-adapters@gmx.de>
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