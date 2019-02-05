/* jshint -W097 */// jshint strict:false
/*jslint node: true */

'use strict';
const utils       = require(__dirname + '/lib/utils'); // Get common adapter utils
const request     = require('request');

const adapterName = require('./package.json').name.split('.').pop();

let result;
let err;
let url = "";
let timer     = null;
let stopTimer = null;
let isStopping = false;
let systemLang = 'de';
let adapter;

function startAdapter(options) {
    options = options || {};
    Object.assign(options, {
        name:           adapterName,
        systemConfig:   true,
        useFormatDate:  true
        /*stateChange: function () {...},
               ...*/
    });
    adapter = new utils.Adapter(options);

    
    adapter.on('objectChange', function (id, obj) {
        adapter.log.info('objectChange ' + id + ' ' + JSON.stringify(obj));
    });

    adapter.on('stateChange', function (id, state) {

    });
    
    adapter.on('unload', function () {
        if (timer) {
            clearInterval(timer);
            timer = 0;
        }
        isStopping = true;
    });
    
    return adapter;
});

let optinNoLog = false;

function stop() {
    if (stopTimer) clearTimeout(stopTimer);

    // Stop only if schedule mode
    if (adapter.common && adapter.common.mode == 'schedule') {
        stopTimer = setTimeout(function () {
            stopTimer = null;
            if (timer) clearInterval(timer);
            isStopping = true;
            adapter.stop();
        }, 30000);
    }
}

process.on('SIGINT', function () {
    if (timer) clearTimeout(timer);
});


function writeLog(logtext,logtype) { // wenn optinNoLog TRUE keine Ausgabe bei info, warn und debug, nur bei error
    if (!optinNoLog) { // Ausgabe bei info, debug und error
        if (logtype === 'silly') adapter.log.silly(logtext);
        if (logtype === 'info') adapter.log.info(logtext);
        if (logtype === 'debug') adapter.log.debug(logtext);
        if (logtype === 'warn') adapter.log.warn(logtext);
        if (logtype === 'error') adapter.log.error(logtext);
    } else { // Ausgabe nur bei error
        if (logtype === 'error') adapter.log.error(logtext);
    }
}

// Dezimalstellen des Preises ermitteln
function cutPrice(preis) {
    preis = parseFloat(preis);
    let temp = preis * 100;   // 100facher Preis jetzt mit einer Nachkommastelle
    const temp2 = preis * 1000; // 1000facher Preis ohne Nachkommastelle
    temp = Math.floor(temp);  // Nachkommastelle (.x) wird abgeschnitten
    temp = temp / 100;          // es bleiben zwei Nachkommastellen
    let price_short = temp.toFixed(2); // Preis mit 2 Nachkommastellen ausgeben (abgeschnitten)
    let price_3rd_digit = Math.ceil(temp2 - (temp * 1000)); // Dritte Nachommastelle einzeln ermitteln
    return {
        priceshort: price_short, // als String wg. Nullen zB 1.10 statt 1.1
        price3rd: parseInt(price_3rd_digit, 10),
        price: preis
    };
}

function readData(url) {
    request(url, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            let result;
            writeLog('Typ Body: ' + typeof body + ' >>> Body Inhalt: ' + body, 'debug'); // fertiges JSON als String
            try{
                result = JSON.parse(body); // String zu Objekt

                //var data = JSON.stringify(result, null, 2); // Objekt zu String für ausgabe
                // JSON check
                if (result.ok) {
                    writeLog('JSON ok', 'debug');
                    adapter.setState('json', {ack: true, val: body}); // nur String (also body) speichern

                    //VARIABLEN NIEDRIGSTER PREIS definieren
                    let cheapest_e5;           // wird mal 0 bis 9
                    let cheapest_e5_stationid; // passende ID der Tankstelle
                    let cheapest_e10;
                    let cheapest_e10_stationid;
                    let cheapest_diesel;
                    let cheapest_diesel_stationid;
                    // Ermitteln, wo der erste Eintrag in der Liste / Einstellungen steht (durch Runterzählen)
                    for (let j = 9; j >= 0; j--) {
                        const stationID = adapter.config.stationsarray[j][0]; // sowas 'a7cdd9cf-b467-4aac-8eab-d662f082511e'
                        if (!adapter.config.stationsarray[j][0]) {
                            adapter.log.debug('Einstellung/Eintrag Nr. ' + j + ' ist leer');
                        } else {
                            if (result.prices[stationID].e5 > 0) {
                                cheapest_e5 = j;
                                cheapest_e5_stationid = adapter.config.stationsarray[j][0];
                            }
                            if (result.prices[stationID].e10 > 0) {
                                cheapest_e10 = j;
                                cheapest_e10_stationid = adapter.config.stationsarray[j][0];
                            }
                            if (result.prices[stationID].diesel > 0) {
                                cheapest_diesel = j;
                                cheapest_diesel_stationid = adapter.config.stationsarray[j][0];
                            }
                        } // die letzten gefundenen Einträge beim Runterzählen,
                          // also die ersten in der Liste sind jetzt der Maßstab für den Vergleich, ob billiger oder nicht
                    }
                    // Reset
                    if (adapter.config.resetValues) {
                        // billigstes E5
                        adapter.setState('stations.cheapest.e5.feed',  0);
                        adapter.setState('stations.cheapest.e5.price', 0);
                        adapter.setState('stations.cheapest.e5.short', '');
                        adapter.setState('stations.cheapest.e5.3rd',   0);// dritte stelle
                        adapter.setState('stations.cheapest.e5.combined', 'keine Daten');
                        adapter.setState('stations.cheapest.e5.name', '');
                        adapter.setState('stations.cheapest.e5.status', '');
                        adapter.setState('stations.cheapest.e5.station_id', '');

                        // billigstes E10
                        adapter.setState('stations.cheapest.e10.feed',  0);
                        adapter.setState('stations.cheapest.e10.price', 0);
                        adapter.setState('stations.cheapest.e10.short', '0');
                        adapter.setState('stations.cheapest.e10.3rd',   0);
                        adapter.setState('stations.cheapest.e10.combined', 'keine Daten');
                        adapter.setState('stations.cheapest.e10.name', '');
                        adapter.setState('stations.cheapest.e10.status', '');
                        adapter.setState('stations.cheapest.e10.station_id', '');

                        // billigster Diesel
                        adapter.setState('stations.cheapest.diesel.feed',  0);
                        adapter.setState('stations.cheapest.diesel.price', 0);
                        adapter.setState('stations.cheapest.diesel.short', '0');// zweistellig
                        adapter.setState('stations.cheapest.diesel.3rd',   0);// dritte stelle
                        adapter.setState('stations.cheapest.diesel.combined', 'keine Daten');
                        adapter.setState('stations.cheapest.diesel.name', '');
                        adapter.setState('stations.cheapest.diesel.status', '');
                        adapter.setState('stations.cheapest.diesel.station_id', '');
                    }

                    // alle Stationen durchgehen
                    for (let i = 0; i < 10; i++) {
                        const stationID   = adapter.config.stationsarray[i][0]; // sowas 'a7cdd9cf-b467-4aac-8eab-d662f082511e'
                        const stationName = adapter.config.stationsarray[i][1]; // sowas 'Esso Hamburg Flughafenstraße'

                        // hier alle States für Status und Preise leeren (0.00 oder 0), falls nicht alle 10 Felder ausgefüllt sind (ohne ack true)
                        if (adapter.config.resetValues) { // Zeile testweise eingefügt
                            adapter.setState('stations.' + i + '.status',      '');
                            adapter.setState('stations.' + i + '.e5.feed',      0);
                            if (i < 2) adapter.setState('stations.' + i + '.e5.feed',      0);
                            adapter.setState('stations.' + i + '.e5.short',     0);
                            adapter.setState('stations.' + i + '.e5.3rd',       0);
                            adapter.setState('stations.' + i + '.e5.combined', '');
                            adapter.setState('stations.' + i + '.e10.feed',     0);
                            if (i < 2) adapter.setState('stations.' + i + '.e10.feed',      0);
                            adapter.setState('stations.' + i + '.e10.short',    0);
                            adapter.setState('stations.' + i + '.e10.3rd',      0);
                            adapter.setState('stations.' + i + '.e10.combined', '');
                            adapter.setState('stations.' + i + '.diesel.feed',  0);
                            if (i < 2) adapter.setState('stations.' + i + '.diesel.feed',      0);
                            adapter.setState('stations.' + i + '.diesel.short', 0);
                            adapter.setState('stations.' + i + '.diesel.3rd',   0);
                            adapter.setState('stations.' + i + '.diesel.combined', '');
                        } // Zeile testweise eingefügt

                        if (stationID.length === 36) { // wenn StationID bekannt, also Settings-Feld gefüllt
                            writeLog('Station ' + stationID + ' ' + stationName + ' wird bearbeitet ...','debug');
                            const status = result.prices[stationID].status;
                            // Namen und Status in jedem Fall schreiben
                            adapter.setState('stations.' + i + '.name', {ack: true, val: stationName});
                            adapter.setState('stations.' + i + '.status', {ack: true, val: status});
                            adapter.setState('stations.' + i + '.station_id', {ack: true, val: stationID});

                            // status checken
                            if (status.indexOf('not found') !== -1) {
                                writeLog('Station ' + stationID + ' nicht gefunden', 'warn');
                                adapter.setState('stations.' + i + '.e5.combined',     '<span class="station_notfound">nicht gefunden</span>');
                                adapter.setState('stations.' + i + '.e10.combined',    '<span class="station_notfound">nicht gefunden</span>');
                                adapter.setState('stations.' + i + '.diesel.combined', '<span class="station_notfound">nicht gefunden</span>');
                            } else if (status.indexOf('closed') !== -1) {
                                writeLog('Station ' + stationID + ' ' + stationName +  ' geschlossen', 'debug');
                                adapter.setState('stations.' + i + '.e5.combined',     '<span class="station_closed">geschlossen</span>');
                                adapter.setState('stations.' + i + '.e10.combined',    '<span class="station_closed">geschlossen</span>');
                                adapter.setState('stations.' + i + '.diesel.combined', '<span class="station_closed">geschlossen</span>');

                            } else if (status.indexOf('open') !== -1) {

                                // wenn false im Preis für e5 steht, ... 0 bleibt stehen
                                if (!result.prices[stationID].e5) {
                                    writeLog('In Station ' + stationID + ' ' + stationName + ' kein E5 vefügbar', 'debug');
                                } else {
                                    const prices = cutPrice(result.prices[stationID].e5);
                                    //adapter.log.debug('In Station ' + stationID + ' ' + stationName + ' kostet E5: ' + result.prices[stationID].e5 + '€');
                                    adapter.setState('stations.' + i + '.e5.feed',  {ack: true, val: parseFloat(result.prices[stationID].e5)});
                                    if (i < 2) adapter.setState('stations.' + i + '.e5.price', {ack: true, val: prices.price}); // normal float
                                    adapter.setState('stations.' + i + '.e5.short', {ack: true, val: prices.priceshort});// zweistellig
                                    adapter.setState('stations.' + i + '.e5.3rd',   {ack: true, val: prices.price3rd});// dritte stelle
                                    adapter.setState('stations.' + i + '.e5.combined', '<span class="station_open">' + prices.priceshort + '<sup style="font-size: 50%">' + prices.price3rd + '</sup> <span class="station_combined_euro">€</span></span>');

                                    // Niedrigsten Preis E5 ermitteln
                                    writeLog('E5-Preis-Feld ' +  i + ' gefüllt', 'debug');
                                    if ( parseFloat(result.prices[stationID].e5) < parseFloat(result.prices[cheapest_e5_stationid].e5) ) {
                                        cheapest_e5 = i;
                                        cheapest_e5_stationid = adapter.config.stationsarray[i][0];
                                        writeLog('Billigster E5 bisher: ' + cheapest_e5 + '. Tankstelle', 'debug');
                                    } else {
                                        writeLog('E5: Station ' + i + ' teurer als bisher billigste Station ' + cheapest_e5, 'debug');
                                    }
                                }

                                if (!result.prices[stationID].e10) {
                                    writeLog('In Station ' + stationID + ' ' + stationName + ' kein E10 vefügbar', 'debug');
                                } else {
                                    const prices = cutPrice(result.prices[stationID].e10);
                                    //adapter.log.debug('In Station ' + stationID + ' ' + stationName + ' kostet E10: ' + result.prices[stationID].e10 + '€');
                                    adapter.setState('stations.' + i + '.e10.feed', {ack: true, val: parseFloat(result.prices[stationID].e10)});
                                    if (i < 2) adapter.setState('stations.' + i + '.e10.price', {ack: true, val: prices.price}); // normal float
                                    adapter.setState('stations.' + i + '.e10.short', {ack: true, val: prices.priceshort});
                                    adapter.setState('stations.' + i + '.e10.3rd', {ack: true, val: prices.price3rd});
                                    adapter.setState('stations.' + i + '.e10.combined', '<span class="station_open">' + prices.priceshort + '<sup style="font-size: 50%">' + prices.price3rd + '</sup> <span class="station_combined_euro">€</span></span>');

                                    /// Niedrigsten Preis E10 ermitteln
                                    writeLog('E10-Preis-Feld ' +  i + ' gefüllt', 'debug');
                                    if ( parseFloat(result.prices[stationID].e10) < parseFloat(result.prices[cheapest_e10_stationid].e10) ) {
                                        cheapest_e10 = i;
                                        cheapest_e10_stationid = adapter.config.stationsarray[i][0];
                                        writeLog('Billigster E10 bisher: ' + cheapest_e10 + '. Tankstelle', 'debug');
                                    } else {
                                        writeLog('E10: Station ' + i + ' teurer als bisher billigste Station ' + cheapest_e10, 'debug');
                                    }
                                }

                                if (!result.prices[stationID].diesel) {
                                    writeLog('In Station ' + stationID + ' ' + stationName + ' kein Diesel vefügbar', 'debug');
                                } else {
                                    const prices = cutPrice(result.prices[stationID].diesel);
                                    //adapter.log.debug('In Station ' + stationID + ' ' + stationName + ' kostet Diesel: ' + result.prices[stationID].diesel + '€');
                                    adapter.setState('stations.' + i + '.diesel.feed', {ack: true, val: parseFloat(result.prices[stationID].diesel)});
                                    if (i < 2) adapter.setState('stations.' + i + '.diesel.price', {ack: true, val: prices.price}); // normal float
                                    adapter.setState('stations.' + i + '.diesel.short', {ack: true, val: prices.priceshort});
                                    adapter.setState('stations.' + i + '.diesel.3rd', {ack: true, val: prices.price3rd});
                                    adapter.setState('stations.' + i + '.diesel.combined', '<span class="station_open">' + prices.priceshort + '<sup style="font-size: 50%">' + prices.price3rd + '</sup> <span class="station_combined_euro">€</span></span>');

                                    // Niedrigsten Preis Diesel ermitteln
                                    writeLog('Diesel-Preis-Feld ' +  i + ' gefüllt', 'debug');
                                    if ( parseFloat(result.prices[stationID].diesel) < parseFloat(result.prices[cheapest_diesel_stationid].diesel) ) {
                                        cheapest_diesel = i;
                                        cheapest_diesel_stationid = adapter.config.stationsarray[i][0];
                                        writeLog('Billigster Diesel bisher: ' + cheapest_diesel + '. Tankstelle', 'debug' );
                                    } else {
                                        writeLog('Diesel: Station ' + i + ' teurer als bisher billigste Station ' + cheapest_diesel, 'debug');
                                    }
                                }
                            } // Ende Status 'open'
                        } // Ende Station
                    } // Ende Schleife

                    // AUSGABE NIEDRIGSTER PREIS
                    // billigstes E5
                    let prices = cutPrice(result.prices[cheapest_e5_stationid].e5);
                    writeLog('Billigster E5: ' + cheapest_e5 + '. Tankstelle ' + adapter.config.stationsarray[cheapest_e5][1] + ', Preis: ' + parseFloat(result.prices[cheapest_e5_stationid].e5), 'debug');
                    adapter.setState('stations.cheapest.e5.feed',  {ack: true, val: parseFloat(result.prices[cheapest_e5_stationid].e5)});
                    adapter.setState('stations.cheapest.e5.price', {ack: true, val: prices.price});// float
                    adapter.setState('stations.cheapest.e5.short', {ack: true, val: prices.priceshort});// zweistellig
                    adapter.setState('stations.cheapest.e5.3rd',   {ack: true, val: prices.price3rd});// dritte stelle
                    adapter.setState('stations.cheapest.e5.combined', '<span class="station_open">' + prices.priceshort + '<sup style="font-size: 50%">' + prices.price3rd + '</sup> <span class="station_combined_euro">€</span></span>');
                    adapter.setState('stations.cheapest.e5.name', {ack: true, val: adapter.config.stationsarray[cheapest_e5][1]});
                    adapter.setState('stations.cheapest.e5.status', {ack: true, val: result.prices[cheapest_e5_stationid].status});
                    adapter.setState('stations.cheapest.e5.station_id', {ack: true, val: cheapest_e5_stationid});

                    // billigstes E10
                    prices = cutPrice(result.prices[cheapest_e5_stationid].e10);
                    writeLog('Billigster E10: ' + cheapest_e10 + '. Tankstelle ' + adapter.config.stationsarray[cheapest_e10][1] + ', Preis: ' + parseFloat(result.prices[cheapest_e10_stationid].e10), 'debug');
                    adapter.setState('stations.cheapest.e10.feed',  {ack: true, val: parseFloat(result.prices[cheapest_e10_stationid].e10)});
                    adapter.setState('stations.cheapest.e10.price', {ack: true, val: prices.price});// float
                    adapter.setState('stations.cheapest.e10.short', {ack: true, val: prices.priceshort});// zweistellig
                    adapter.setState('stations.cheapest.e10.3rd',   {ack: true, val: prices.price3rd});// dritte stelle
                    adapter.setState('stations.cheapest.e10.combined', '<span class="station_open">' + prices.priceshort + '<sup style="font-size: 50%">' + prices.price3rd + '</sup> <span class="station_combined_euro">€</span></span>');
                    adapter.setState('stations.cheapest.e10.name', {ack: true, val: adapter.config.stationsarray[cheapest_e10][1]});
                    adapter.setState('stations.cheapest.e10.status', {ack: true, val: result.prices[cheapest_e10_stationid].status});
                    adapter.setState('stations.cheapest.e10.station_id', {ack: true, val: cheapest_e10_stationid});

                    // billigster Diesel
                    prices = cutPrice(result.prices[cheapest_e5_stationid].diesel);
                    writeLog('Billigster Diesel: ' + cheapest_diesel + '. Tankstelle ' + adapter.config.stationsarray[cheapest_diesel][1] + ', Preis: ' + parseFloat(result.prices[cheapest_diesel_stationid].diesel), 'debug');
                    adapter.setState('stations.cheapest.diesel.feed',  {ack: true, val: parseFloat(result.prices[cheapest_diesel_stationid].diesel)});
                    adapter.setState('stations.cheapest.diesel.price', {ack: true, val: prices.price});// float
                    adapter.setState('stations.cheapest.diesel.short', {ack: true, val: prices.priceshort});// zweistellig
                    adapter.setState('stations.cheapest.diesel.3rd',   {ack: true, val: prices.price3rd});// dritte stelle
                    adapter.setState('stations.cheapest.diesel.combined', '<span class="station_open">' + prices.priceshort + '<sup style="font-size: 50%">' + prices.price3rd + '</sup> <span class="station_combined_euro">€</span></span>');
                    adapter.setState('stations.cheapest.diesel.name', {ack: true, val: adapter.config.stationsarray[cheapest_diesel][1]});
                    adapter.setState('stations.cheapest.diesel.status', {ack: true, val: result.prices[cheapest_diesel_stationid].status});
                    adapter.setState('stations.cheapest.diesel.station_id', {ack: true, val: cheapest_diesel_stationid});
                    // ENDE AUSGABE NIEDRIGSTER PREIS

                    writeLog('objects written', 'debug');

                } else {
                    writeLog('JSON returns error - Station ID or API-Key probably not correct', 'error');
                }
            } catch (e) {
                writeLog('Spritpreise einlesen (gezielte Stationen via ID) - Parse Fehler: ' + e, 'error');
            }
        } else writeLog('Spritpreise einlesen (gezielte Stationen via ID) - Fehler: ' + error, 'error');
    });   // Ende request
    adapter.stop();
}

function buildQuery() { // Abfrage erstellen (max 10 Tankstellen ID)
    /* String muss so aussehenen: 'ididididididid','idididididid'
       dabei werden Häkchen und Komma URLencoded dargestellt, also %2C für Komma und %22 für Häkchen
       die folgenden Zeilen fügen die Felder mit den ID der Stationen zusammen, unabhänggig, ob Felder
       freigeblieben sind. Vor dem ersten und nach dem letzten Feld kommt natürlich kein Komma.
    */
    var stations = (adapter.config.station0.length > 0) ? '%22' + adapter.config.station0 + '%22' : '';
    //adapter.log.debug('Stations 1: ' + stations);
    if (stations.length > 0) stations = (adapter.config.station1.length > 0) ? stations + '%2C%22' + adapter.config.station1 + '%22' : stations;
    else stations = (adapter.config.station1.length > 0) ? stations + '%22' + adapter.config.station1 + '%22' : stations;
    //adapter.log.debug('Stations 2: ' + stations);
    if (stations.length > 0) stations = (adapter.config.station2.length > 0) ? stations + '%2C%22' + adapter.config.station2 + '%22' : stations;
    else stations = (adapter.config.station2.length > 0) ? stations + '%22' + adapter.config.station2 + '%22' : stations;
    //adapter.log.debug('Stations 3: ' + stations);
    if (stations.length > 0) stations = (adapter.config.station3.length > 0) ? stations + '%2C%22' + adapter.config.station3 + '%22' : stations;
    else stations = (adapter.config.station3.length > 0) ? stations + '%22' + adapter.config.station3 + '%22' : stations;
    //adapter.log.debug('Stations 4: ' + stations);
    if (stations.length > 0) stations = (adapter.config.station4.length > 0) ? stations + '%2C%22' + adapter.config.station4 + '%22' : stations;
    else stations = (adapter.config.station4.length > 0) ? stations + '%22' + adapter.config.station4 + '%22' : stations;
    //adapter.log.debug('Stations 5: ' + stations);
    if (stations.length > 0) stations = (adapter.config.station5.length > 0) ? stations + '%2C%22' + adapter.config.station5 + '%22' : stations;
    else stations = (adapter.config.station5.length > 0) ? stations + '%22' + adapter.config.station5 + '%22' : stations;
    //adapter.log.debug('Stations 6: ' + stations);
    if (stations.length > 0) stations = (adapter.config.station6.length > 0) ? stations + '%2C%22' + adapter.config.station6 + '%22' : stations;
    else stations = (adapter.config.station6.length > 0) ? stations + '%22' + adapter.config.station6 + '%22' : stations;
    //adapter.log.debug('Stations 7: ' + stations);
    if (stations.length > 0) stations = (adapter.config.station7.length > 0) ? stations + '%2C%22' + adapter.config.station7 + '%22' : stations;
    else stations = (adapter.config.station7.length > 0) ? stations + '%22' + adapter.config.station7 + '%22' : stations;
    //adapter.log.debug('Stations 8: ' + stations);
    if (stations.length > 0) stations = (adapter.config.station8.length > 0) ? stations + '%2C%22' + adapter.config.station8 + '%22' : stations;
    else stations = (adapter.config.station8.length > 0) ? stations + '%22' + adapter.config.station8 + '%22' : stations;
    //adapter.log.debug('Stations 9: ' + stations);
    if (stations.length > 0) stations = (adapter.config.station9.length > 0) ? stations + '%2C%22' + adapter.config.station9 + '%22' : stations;
    else stations = (adapter.config.station9.length > 0) ? stations + '%22' + adapter.config.station9 + '%22' : stations;
    //adapter.log.debug('Stations 10: ' + stations);

    // String in URL einbetten (in eckigen Klammern) und mit APIKey
    var url = 'https://creativecommons.tankerkoenig.de/json/prices.php?ids=%5B' + stations + '%5D&apikey=' + adapter.config.apikey;
    return url;
}

function syncConfig(callback) {
    //APIKEY

    let tasks = [];

    writeLog('Option <reset values> is ' + adapter.config.resetValues, 'debug');
    writeLog('API Key Länge: ' + (adapter.config.apikey?adapter.config.apikey.length:0) + ' Zeichen', 'debug');
    if (adapter.config.apikey === undefined) {
        writeLog('No API-Key found.', 'error');
        return; // abbruch
    } else if (adapter.config.apikey.length < 36) {
        writeLog('API-Key too short, should be 36 digits.', 'error');
        return; // abbruch
    } else if (adapter.config.apikey.length > 36) {
        writeLog('API-Key too long, should be 36 digits.', 'error');
        return; // abbruch
    }

    tasks.push({
        type: 'extendObject',
        id:   'tank',
        data: {
            common: {
                name: 'tank',
                read: true,
                write: false
            }
        }
    });

    processTasks(tasks, function () {
        var count = 0;
        url = buildQuery();

        if (!count && callback) callback();
    });

    // noLog
    optinNoLog = adapter.config.noLogs; // wichtig für function writeLog()
}


function processTasks(tasks, callback) {
    if (!tasks || !tasks.length) {
        callback && callback();
    } else {
        let task = tasks.shift();
        let timeout = setTimeout(function () {
            adapter.log.warn('Please update js-controller to at least 1.2.0');
            timeout = null;
            processTasks(tasks, callback);
        }, 1000);

        if (task.type === 'extendObject') {
            adapter.extendObject(task.id, task.data, function (/* err */) {
                if (timeout) {
                    clearTimeout(timeout);
                    timeout = null;
                    setImmediate(processTasks, tasks, callback);
                }
            });
        } else  if (task.type === 'deleteState') {
            adapter.deleteState('', host, task.id, function (/* err */) {
                if (timeout) {
                    clearTimeout(timeout);
                    timeout = null;
                    setImmediate(processTasks, tasks, callback);
                }
            });
        } else {
            adapter.log.error('Unknown task name: ' + JSON.stringify(task));
            if (timeout) {
                clearTimeout(timeout);
                timeout = null;
                setImmediate(processTasks, tasks, callback);
            }
        }
    }
}


function getTanke(tanke) {
    if (stopTimer) clearTimeout(stopTimer);
    if (!tanke) {
        timer = setTimeout(function () {
            getTanke('go');
        }, adapter.config.interval);
        return;
    }
    readData(url);
    if (!isStopping)  {
        setTimeout(function () {
            getTanke('');
        }, 0);
    };
}


function main() {
 //   adapter.config.interval = parseInt(adapter.config.interval, 10);
    adapter.config.interval = 0;

// polling min 15 min.
    if (adapter.config.interval < 5000) {
        adapter.config.interval = 60 * 1000 * 15;
    }
    syncConfig(function () {
        getTanke('go');
    });
    adapter.subscribeStates('*');
}

// If started as allInOne/compact mode => return function to create instance
if (module && module.parent) {
    module.exports = startAdapter;
} else {
    // or start the instance directly
    startAdapter();
}
