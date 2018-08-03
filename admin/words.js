<<<<<<< HEAD
/*global systemDictionary:true */
'use strict';

systemDictionary = {
    "IP": {                                          "en": "ip adress of homepilot station",                  "de": "IP Adresse der Homepilot Basisstation",           "ru": "IP-адрес домашней контрольной станции",           "pt": "endereço ip da estação piloto de origem",         "nl": "IP-adres van thuis-loodsstation",                 "fr": "adresse IP de la station de pilotage à domicile", "it": "indirizzo IP della stazione pilota di casa",      "es": "dirección IP de la estación piloto",              "pl": "adres ip stacji pilota domowego"},
    "Port": {                                        "en": "Port number",                                     "de": "Port Nummer",                                     "ru": "Номер порта",                                     "pt": "Número da porta",                                 "nl": "Poortnummer",                                     "fr": "Numéro de port",                                  "it": "Numero di porta",                                 "es": "Número de puerto",                                "pl": "Numer portu"},
    "default is 12": {                               "en": "if left empty '12' will be used",                 "de": "ohne Eingabe wird '12' verwendet",                "ru": "если останется пустой «12»",                      "pt": "se deixado vazio '12' será usado",                "nl": "als dit wordt gelaten, wordt de lege '12' gebruikt", "fr": "si laissé vide '12' sera utilisé",                "it": "se lasciato vuoto verrà usato '12'",              "es": "si se deja en blanco, se usará \"12\"",           "pl": "jeśli pozostawisz puste \"12\" zostanie użyte"},
    "homepilot Adapter settings": {                  "en": "homepilot blinds Adapter settings",               "de": "Homepilot Rollladen Adapter Einstellungen",       "ru": "Настройки жалюзи homepilot",                      "pt": "configurações de adaptador de persianas do homepilot", "nl": "Homepilot blinds Adapterinstellingen",            "fr": "stores homepilot Paramètres de l'adaptateur",     "it": "homepilot blinds Impostazioni dell'adattatore",   "es": "Persianas de homepilot Configuración del adaptador", "pl": "rolety Homepilota Ustawienia adaptera"},
    "homepilot station": {                           "en": "Homepilot station",                               "de": "Homepilot Basisstation",                          "ru": "Станция Homepilot",                               "pt": "Estação de Homepilot",                            "nl": "Homepilot-station",                               "fr": "Station homepilot",                               "it": "Stazione di Homepilot",                           "es": "Estación de Homepilot",                           "pl": "Stacja Homepilot"},
    "if left empty 'homepilot.local' will be used": {"en": "if left empty 'homepilot.local' will be used",    "de": "ohne Eingabe wird 'homepilot.local' verwendet",   "ru": "если останется пустой «homepilot.local», будет использоваться", "pt": "se deixado vazio, 'homepilot.local' será usado",  "nl": "indien leeg wordt 'homepilot.local' gebruikt",    "fr": "si laissé vide 'homepilot.local' sera utilisé",   "it": "se lasciato vuoto verrà usato 'homepilot.local'", "es": "si se deja en blanco, se usará 'homepilot.local'", "pl": "jeśli zostanie użyty pusty \"homepilot.local\""},
    "normally no port setting is required": {        "en": "normally no port is required",                    "de": "normalerweise wird keine Porteingabe benötigt",   "ru": "обычно не требуется порт",                        "pt": "normalmente nenhuma porta é necessária",          "nl": "normaal is geen poort vereist",                   "fr": "Normalement, aucun port n'est requis",            "it": "normalmente non è richiesta alcuna porta",        "es": "normalmente no se requiere puerto",               "pl": "zwykle żaden port nie jest wymagany"},
};
=======
systemDictionary = {
    "tankerkoenig Adapter settings": {
        "en": "tankerkoenig Adapter settings",
        "de": "tankerkoenig Adapter Einstellungen",
        "ru": "Настройки tankerkoenig Adapter"
    },
    "tankerkoenig API": {
        "en": "tankerkoenig api key (36 digits):",
        "de": "tankerkoenig API-Schlüssel (36 Zeichen):",
        "ru": "tankerkoenig API-Key:"
    },
    "API-Key": {
        "en": "api key",
        "de": "API-Schlüssel",
        "ru": "API-Key"
    },
    "Tankstellen":       	{
        "en": "Gas Stations",
        "de": "Tankstellen",
        "ru": "Tankstellen"
    },
    "Geben Sie die ID der gew&uuml;nschten Tankstelle ein. Es sind maximal zehn Tankestellen m&ouml;glich.": {
        "en": "ID of gas station",
        "de": "Geben Sie die ID der gew&uuml;nschten Tankstelle ein. Es sind maximal zehn Tankestellen m&ouml;glich.<br>Sie erhalten die ID der Tankstellen durch Eingabe Ihrer Geo-Koordinaten bei der Umkreissuche auf tankerkoenig.de",
        "ru": "ID of gas station"
    },
    "Sie erhalten den API Schl&uuml;ssel auf der Seite creativecommons.tankerkoenig.de": {
        "en": "Input your personal 36digit API-Key from <a href='https://creativecommons.tankerkoenig.de/#register' target='_blank' alt='register API' >tankerkoenig.de</a>",
        "de": "Sie erhalten den API Schl&uuml;ssel auf der Seite <a href='https://creativecommons.tankerkoenig.de/#register' target='_blank' alt='register API' >tankerkoenig.de</a>",
        "ru": "Input the 36digit API-Key from <a href='https://creativecommons.tankerkoenig.de/#register' target='_blank' alt='register API' >tankerkoenig.de</a>"
    },
    "ID Tankstelle": {
        "en": "Station ID (36 digits)",
        "de": "ID Tankstelle (36 Zeichen)",
        "ru": "ID Tankstelle (36 digits)"
    },
    "Name Tankstelle": {
        "en": "Custom station name",
        "de": "Eigener Name für Tankstelle (z.B. ARAL Bahnhofsplatz)",
        "ru": "Custom station name"
    },
    "Nummer": {
        "en": "No.",
        "de": "Nr.",
        "ru": "#"
    },
    "Werte nullen": {
        "en": "Reset values",
        "de": "Werte nullen",
        "ru": "Werte nullen (übersetzen)"
    },
    "Der Adapter ...": {
        "en": "The adapter resets all prices before every scheduled refresh. This function prevents from saving outdated values if any error occurs while updating from the tankerkoenig-server.<br>To keep the data fluently without zeroes tick off this box.",
        "de": "Der Adapter setzt bei jeder Aktualisierung der Preise vorher den Wert 0. Damit wird verhindert, dass sich ein veralteter Preis über evtl. Störungen bei der Aktualisierung hinweg hält.<br>Wenn Sie den Haken entfernen, wird keine 0 gesetzt. Damit werden Aufzeichnungen gleichmäßiger.",
        "ru": "Der Adapter setzt bei jeder Aktualisierung der Preise vorher den Wert 0. Damit wird verhindert, dass sich ein veralteter Preis über evtl. Störungen bei der Aktualisierung hinweg hält.<br>Wenn Sie den Haken entfernen, wird keine 0 gesetzt. Damit werden Aufzeichnungen gleichmäßiger. (übersetzen)"
    },
    "Reset": {
        "en": "Reset values",
        "de": "Werte vor jeder Aktualisierung nullen",
        "ru": "Werte vor jeder Aktualisierung nullen (übersetzen)"
    },
    "kein Log": {
        "en": "Minimize log events",
        "de": "Log Ausgaben reduzieren",
        "ru": "Minimize log events (übersetzen)"
    },
    "Logdaten minimieren": {
        "en": "Logging data",
        "de": "Log Daten",
        "ru": "Log Daten (übersetzen)"
    },
    "Logdaten ...": {
        "en": "Every run creates log entries. Wwiting log events can be opted out here.",
        "de": "Bei jeder Aktualisierung werden Log-Ausgaben geschrieben. Um die Zahl der Schreibzugriffe zu minimieren, kann hier durch einen Haken die Ausgabe reduziert werden.",
        "ru": "Every run creates log entries. Wwiting log events can be opted out here. (übersetzen)"
    }
};
>>>>>>> origin/master
