/* jshint -W097 */// jshint strict:false
/*jslint node: true */

"use strict";
var utils       = require(__dirname + '/lib/utils'); // Get common adapter utils
var request     = require('request');
var lang = 'de';

var adapter = utils.adapter({
    name:           'tankerkoenig',
    systemConfig:   true,
    useFormatDate:  true
});

adapter.on('ready', function () {
    adapter.getForeignObject('system.config', function (err, data) {
        if (data && data.common) {
            lang  = data.common.language;
        }

        adapter.log.debug('initializing objects');
        main();
        adapter.log.info('objects written');

        setTimeout(function () {
            adapter.log.info('force terminating adapter after 1 minute');
            adapter.stop();
        }, 60000);

    });
});

function readSettings() {
    //APIKEY
    adapter.log.debug('API Key Länge: ' + adapter.config.apikey.length + ' Zeichen');
   if (adapter.config.apikey === undefined) {
        adapter.log.warn('No API-Key found.');
        return; // abbruch
    } else if (adapter.config.apikey.length < 36) {
        adapter.log.warn('API-Key too short.');
        return; // abbruch
    } else { 
        buildQuery();
    } 
}

function buildQuery() { // Abfrage erstellen (max 10 Tankstellen ID)
    /* String muss so aussehenen: "ididididididid","idididididid"
       dabei werden Häkchen und Komma URLencoded dargestellt, also %2C für Komma und %22 für Häkchen
       die folgenden Zeilen fügen die Felder mit den ID der Stationen zusammen, unabhänggig, ob Felder 
       freigeblieben sind. Vor dem ersten und nach dem letzten Feld kommt natürlich kein Komma.
    */
    var stations = (adapter.config.station0.length > 0) ? '%22' + adapter.config.station0 + '%22' : '';
    adapter.log.debug('Stations 1: ' + stations);
    if (stations.length > 0) stations = (adapter.config.station1.length > 0) ? stations + '%2C%22' + adapter.config.station1 + '%22' : stations;
    else stations = (adapter.config.station1.length > 0) ? stations + '%22' + adapter.config.station1 + '%22' : stations;
    adapter.log.debug('Stations 2: ' + stations);
    if (stations.length > 0) stations = (adapter.config.station2.length > 0) ? stations + '%2C%22' + adapter.config.station2 + '%22' : stations;
    else stations = (adapter.config.station2.length > 0) ? stations + '%22' + adapter.config.station2 + '%22' : stations;
    adapter.log.debug('Stations 3: ' + stations);
    if (stations.length > 0) stations = (adapter.config.station3.length > 0) ? stations + '%2C%22' + adapter.config.station3 + '%22' : stations;
    else stations = (adapter.config.station3.length > 0) ? stations + '%22' + adapter.config.station3 + '%22' : stations;
    adapter.log.debug('Stations 4: ' + stations);
    if (stations.length > 0) stations = (adapter.config.station4.length > 0) ? stations + '%2C%22' + adapter.config.station4 + '%22' : stations;
    else stations = (adapter.config.station4.length > 0) ? stations + '%22' + adapter.config.station4 + '%22' : stations;
    adapter.log.debug('Stations 5: ' + stations);
    if (stations.length > 0) stations = (adapter.config.station5.length > 0) ? stations + '%2C%22' + adapter.config.station5 + '%22' : stations;
    else stations = (adapter.config.station5.length > 0) ? stations + '%22' + adapter.config.station5 + '%22' : stations;
    adapter.log.debug('Stations 6: ' + stations);
    if (stations.length > 0) stations = (adapter.config.station6.length > 0) ? stations + '%2C%22' + adapter.config.station6 + '%22' : stations;
    else stations = (adapter.config.station6.length > 0) ? stations + '%22' + adapter.config.station6 + '%22' : stations;
    adapter.log.debug('Stations 7: ' + stations);
    if (stations.length > 0) stations = (adapter.config.station7.length > 0) ? stations + '%2C%22' + adapter.config.station7 + '%22' : stations;
    else stations = (adapter.config.station7.length > 0) ? stations + '%22' + adapter.config.station7 + '%22' : stations;
    adapter.log.debug('Stations 8: ' + stations);
    if (stations.length > 0) stations = (adapter.config.station8.length > 0) ? stations + '%2C%22' + adapter.config.station8 + '%22' : stations;
    else stations = (adapter.config.station8.length > 0) ? stations + '%22' + adapter.config.station8 + '%22' : stations;    
    adapter.log.debug('Stations 9: ' + stations);
    if (stations.length > 0) stations = (adapter.config.station9.length > 0) ? stations + '%2C%22' + adapter.config.station9 + '%22' : stations;
    else stations = (adapter.config.station9.length > 0) ? stations + '%22' + adapter.config.station9 + '%22' : stations;    
    adapter.log.debug('Stations 10: ' + stations);
    
    // String in URL einbetten (in eckigen Klammern) und mit APIKey
    var url = 'https://creativecommons.tankerkoenig.de/json/prices.php?ids=%5B' + stations + '%5D&apikey=' + adapter.config.apikey; 
    readData(url);    
}

// Dezimalstellen des Preises ermitteln
function cutPrice(preis) {
    preis = parseFloat(preis);
    var rechenwert = preis * 100;   // 100facher Preis jetzt mit einer Nachkommastelle
    var rechenwert2 = preis * 1000; // 1000facher Preis ohne Nachkommastelle
    rechenwert = Math.floor(rechenwert);  // Nachkommastelle (.x) wird abgeschnitten
    rechenwert = rechenwert/100;          // es bleiben zwei Nachkommastellen
    var ohne_dritte_stelle = rechenwert.toFixed(2); // Preis mit 2 Nachkommastellen ausgeben (abgeschnitten)
    var dritte_stelle = Math.ceil(rechenwert2 - (rechenwert * 1000)); // Dritte Nachommastelle einzeln ermitteln
    return {
        'priceshort': parseFloat(ohne_dritte_stelle),
        'price3rd': parseInt(dritte_stelle,10)
    }; 
}

function readData(url) {
    request(url, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var result;
            adapter.log.debug('Typ Body: ' + typeof body + ' --- Body Inhalt: ' + body); // fertiges JSON als String
            try{
                result = JSON.parse(body); // String zu Objekt
                
                //var data = JSON.stringify(result, null, 2); // Objekt zu String für ausgabe
                // JSON check
                if (result.ok) {
                    adapter.log.debug('JSON ok');
                    //adapter.log.debug(result); //	[object Object]
                    adapter.setState('json', {ack: true, val: body}); // nur String (also body) speichern
                    
                    // alle Stationen durchgehen
                    for (var i = 0; i < 10; i++) {
                        var stationid   = adapter.config.stationsarray[i][0]; // sowas "a7cdd9cf-b467-4aac-8eab-d662f082511e"
                        var stationname = adapter.config.stationsarray[i][1]; // sowas "Esso Hamburg Flughafenstraße"
                        
                        // hier alle States für Status und Preise leeren (0.00 oder 0), falls nicht alle 10 Felder ausgefüllt sind (ohne ack true)
                        adapter.setState('stations.' + i + '.status',      '');
                        adapter.setState('stations.' + i + '.e5.feed',      0);
                        adapter.setState('stations.' + i + '.e5.short',     0);
                        adapter.setState('stations.' + i + '.e5.3rd',       0);
                        adapter.setState('stations.' + i + '.e10.feed',     0);
                        adapter.setState('stations.' + i + '.e10.short',    0);
                        adapter.setState('stations.' + i + '.e10.3rd',      0);
                        adapter.setState('stations.' + i + '.diesel.feed',  0);
                        adapter.setState('stations.' + i + '.diesel.short', 0);
                        adapter.setState('stations.' + i + '.diesel.3rd',   0);
                        
                        if (stationid.length == 36) { // wenn StationID bekannt, also Settings-Feld gefüllt
                            adapter.log.debug('Station ' + stationid + ' ' + stationname + ' wird bearbeitet ...');
                            // status checken
                            var status = result.prices[stationid].status;
                            if (status.indexOf("not found") != -1) {
                                adapter.log.warn('Station ' + stationid + ' nicht gefunden');
                            } else if (status.indexOf("closed") != -1) {
                                adapter.log.warn('Station ' + stationid + ' ' + stationname + ' geschlossen');
                            } else if (status.indexOf("open") != -1) {
                                
                                // wenn false im Preis für e5 steht, ... 0 bleibt stehen
                                if (!result.prices[stationid].e5) {
                                    adapter.log.debug('In Station ' + stationid + ' ' + stationname + ' kein E5 vefügbar'); 
                                } else { 
                                    //adapter.log.debug('In Station ' + stationid + ' ' + stationname + ' kostet E5: ' + result.prices[stationid].e5 + '€');
                                    adapter.setState('stations.' + i + '.e5.feed',  {ack: true, val: parseFloat(result.prices[stationid].e5)});
                                    adapter.setState('stations.' + i + '.e5.short', {ack: true, val: cutPrice(result.prices[stationid].e5).priceshort});// zweistellig
                                    adapter.setState('stations.' + i + '.e5.3rd',   {ack: true, val: cutPrice(result.prices[stationid].e5).price3rd});// dritte stelle
                                }
                                
                                if (!result.prices[stationid].e10) {
                                    adapter.log.debug('In Station ' + stationid + ' ' + stationname + ' kein E10 vefügbar'); 
                                } else { 
                                    //adapter.log.debug('In Station ' + stationid + ' ' + stationname + ' kostet E10: ' + result.prices[stationid].e10 + '€');
                                    adapter.setState('stations.' + i + '.e10.feed', {ack: true, val: parseFloat(result.prices[stationid].e10)});
                                    adapter.setState('stations.' + i + '.e10.short', {ack: true, val: cutPrice(result.prices[stationid].e10).priceshort});
                                    adapter.setState('stations.' + i + '.e10.3rd', {ack: true, val: cutPrice(result.prices[stationid].e10).price3rd});
                                }
                                
                                if (!result.prices[stationid].diesel) {
                                    adapter.log.debug('In Station ' + stationid + ' ' + stationname + ' kein Diesel vefügbar'); 
                                } else { 
                                    //adapter.log.debug('In Station ' + stationid + ' ' + stationname + ' kostet Diesel: ' + result.prices[stationid].diesel + '€');
                                    adapter.setState('stations.' + i + '.diesel.feed', {ack: true, val: parseFloat(result.prices[stationid].diesel)});
                                    adapter.setState('stations.' + i + '.diesel.short', {ack: true, val: cutPrice(result.prices[stationid].diesel).priceshort});
                                    adapter.setState('stations.' + i + '.diesel.3rd', {ack: true, val: cutPrice(result.prices[stationid].diesel).price3rd});
                                }
                            }
                            adapter.setState('stations.' + i + '.name', {ack: true, val: stationname});
                            adapter.setState('stations.' + i + '.status', {ack: true, val: status});
                        } // Ende Station
                    } // Ende Schleife
                } else {
                    adapter.log.warn('JSON returns error - Station ID or API-Key probably not correct');
                }
            } catch (e) {
                adapter.log.error('Spritpreise einlesen (gezielte Stationen via ID) - Parse Fehler: ' + e);
            }    
        } else adapter.log.error('Spritpreise einlesen (gezielte Stationen via ID) - Fehler: ' + error);
    });   // Ende request 
}



function main() {
    readSettings();
    adapter.stop();
}