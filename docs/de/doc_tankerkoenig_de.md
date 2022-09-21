![Logo](../../admin/tankerkoenig.png)
# ioBroker.tankerkoenig

![Number of Installations](http://iobroker.live/badges/tankerkoenig-installed.svg) ![Number of Installations](http://iobroker.live/badges/tankerkoenig-stable.svg) [![NPM version](http://img.shields.io/npm/v/iobroker.tankerkoenig.svg)](https://www.npmjs.com/package/iobroker.tankerkoenig)
[![Downloads](https://img.shields.io/npm/dm/iobroker.tankerkoenig.svg)](https://www.npmjs.com/package/iobroker.tankerkoenig)

[//]: # ([![Known Vulnerabilities]&#40;https://snyk.io/test/github/iobroker-community-adapters/ioBroker.tankerkoenig/badge.svg?targetFile=package.json&#41;]&#40;https://snyk.io/test/github/iobroker-community-adapters/ioBroker.tankerkoenig?targetFile=package.json&#41;)

[![NPM](https://nodei.co/npm/iobroker.tankerkoenig.png?downloads=true)](https://nodei.co/npm/iobroker.tankerkoenig/)

**Tests:**
[![Test and Release](https://github.com/iobroker-community-adapters/ioBroker.tankerkoenig/actions/workflows/test-and-release.yml/badge.svg)](https://github.com/iobroker-community-adapters/ioBroker.tankerkoenig/actions/workflows/test-and-release.yml)

## Beschreibung
:de: Dieser Adapter liefert die Spritpreise für 10 festgelegte Tankstellen über den JSON Feed der Internetseite [tankerkoenig.de](https://creativecommons.tankerkoenig.de/#about). Die Daten werden in Objekte gespeichert, um in [ioBroker.vis](https://github.com/ioBroker/ioBroker.vis) verarbeitet zu werden.
Der Adapter verwendet die Seite `prices.php`, welche beim Quellserver von tankerkoenig.de durch die gleichzeitige Abfrage vieler Stationen und die Rückgabe von nur wenigen Daten insgesamt sehr viel weniger Datenverkehr verursacht, als die Abfrage über `list.php` (Umkreissuche) oder `detail.php` (Einzelabfrage einer Tankstelle). Auf die beiden anderen Formen der Abfrage wurde bewusst verzichtet. Somit ist keine Umkreissuche (zB sortiert nach Preis) und keine Lieferung genauerer Daten (Straße, Marke, Hausnummer, etc.) möglich. Die jeweils günstigste Tankstelle für die drei Spritsorten E5, E10 und Diesel werden in einem separaten Kanal gespeichert.

## Einstellungen
### API-Key
Der API Schlüssel ist auf der [Seite von Tankerkönig](https://creativecommons.tankerkoenig.de/#about) erhältlich. Die 36stellige Zeichenkette muss hier eingetragen werden.

### Tankstellen
Es können bis zu 10 Tankstellen abgefragt werden. Dazu ist die Eingabe der Tankstellen ID nötig. Die ID für jede Tankstelle erhält man auf tankerkoenig.de. Sie ist ebenfalls 36stellig.
Zusätzlich kann ein eigener Name für die Station hinterlegt werden.
![alt text](img/tankerkoenigSettingsScreenshot1.png "Screenshot Settings")
![alt text](img/tankerkoenigSettingsScreenshot2.png "Screenshot Settings")

Über dieses Fenster werden die neuen Stationen hinzugefügt, man kann direkt in der Karte darunter die Stadions-ID auslesen und in das Feld oben kopieren.
Unter der Rabatt Optionen kann man zwischen den Rabatt Varianten ⇨ Euro / Prozent auswählen und für welchen Kraftstoffart der Rabatt gilt (Standard sind alle ausgewählt)

![alt text](img/tankerkoenigStationFinder.png "Screenshot Settings")

### Werte auf 0 setzen
Aktivieren Sie diese Funktion, wenn die Preise auf 0 gesetzt werden sollen, wenn die Tankstelle geschlossen ist.\
Wenn die Funktion ausgeschaltet ist, werden die Preise als ungültig gesetzt, siehe unten.

### Ungültige Preise
Wenn eine Tankstelle keine Preise für E5, E10 oder Diesel liefert, z. B. bei einer geschlossenen Station, wird der Preis sich nicht ändern stattdessen wird die state Qualität auf `Qualitätscode 0x40 => Ersatzwert aus Gerät` gesetzt, der state wird dann orange angezeigt.

![alt text](img/state_quality.png "Screenshot Settings")

### Log minimieren
Um Schreibzugriffe im Log (z.B. auf empfindliche SD-Karten) zu minimieren, kann ein Haken gesetzt werden.

## Aktivierung
Der Adapter läuft als Daemon (nicht im Schedule Modus) und startet regulär alle fünf Minuten. Die Daten des Quellfeeds werden vom Server bei tankerkoenig.de nur alle 4min aktualisiert, daher macht eine häufigere Abfrage der Daten keinen Sinn und verursacht nur überflüssigen Datenverkehr und kostet Ressourcen. Größere Intervalle sind jederzeit einstellbar.

##  Datenpunkte
Die Datenpunkte werden dynamisch erstellt, das heißt, wen man eine Station anlegt werden Datenpunkte dazu angelegt (Maximal 10 Stationen)
Wenn man eine Station löscht, werden auch die nicht mehr benötigten Datenpunkte gelöscht.
![alt text](img/tankerkoenigNewDP.png "Screenshot Settings")
Unter den verschiedenen Kraftstoffart werden die folgenden Datenpunkte:
* `feed` (Preis mit drei Dezimalstellen als Number)
* `short` (Preis mit zwei Dezimalstellen (ungerundet) als String)
* `3rd` (dritte Dezimalstelle des Preises zur Darstellung der Hochzahl in VIS)
* `combined` (fertig HTML formatiert mit Preis und hochgestellter dritter Dezimalstelle oder ggf. Öffnungsstatus ["closed"/"not found"] zur einfachen Darstellung mit VIS HTML Widget)

Außerdem werden noch fünf Datenpunkte auf in der jeweiligen Station erstellt:
* `discount` (Rabatt in Euro / Prozent als Number)
* `discounted` (Zeigt an, ob ein Rabatt aktiv ist oder nicht)
* `status` (Station geöffnet?)
* `name` (vom Nutzer vergebener Name der Tankstelle)
* `station_id` (Tankerkönig ID der Tankstelle)

Zusätzlich werden noch den die günstigsten Tankstellen aus der Liste in die Kanäle ermittelt
* `cheapest.E5`
* `chepest.E10`
* `cheapest.diesel`

Auf der Stations ebenen werden weitere fünf Datenpunkte erstellt:
* `adapterStatus` (zeigt den status vom adapter an mögliche Werte: `idle / automatic request / manual request / requet timeout 1min / write states / request Error / offline`)
* `json` (JSON Daten der Tankstelle)
* `jsonTable` (json Tabelle für die vis `nur die json Daten kein Widget`)

![alt text](img/jsonTable.png "Screenshot Settings")
* `lastUpdate` (Zeitpunkt der letzten Aktualisierung)
* `refresh` (Dies ist ein Button, mit dem man die Daten manuell aktualisieren kann `ACHTUNG` nach einmaligen auslösen ist es für 1 minute nicht mehr möglich die manuelle Aktualisierung auszulösen)


Innerhalb dieser Kanäle ist die jeweils günstigste Tankstelle für die genannte Kraftstoffart angelegt. Bieten mehrere Tankstellen einen Treibstoff zum gleichen Preis an, wird die Station ausgegeben, die in den Einstellungen zuerst/ganz oben eingetragen wurde.

## VIS Nutzung
Der Datenpunkt combined lässt sich in VIS mit diesem Widget darstellen
```js
[{"tpl":"tplHtml","data":{"visibility-cond":"==","visibility-val":1,"refreshInterval":"0","gestures-offsetX":0,"gestures-offsetY":0,"signals-cond-0":"==","signals-val-0":true,"signals-icon-0":"/vis/signals/lowbattery.png","signals-icon-size-0":0,"signals-blink-0":false,"signals-horz-0":0,"signals-vert-0":0,"signals-hide-edit-0":false,"signals-cond-1":"==","signals-val-1":true,"signals-icon-1":"/vis/signals/lowbattery.png","signals-icon-size-1":0,"signals-blink-1":false,"signals-horz-1":0,"signals-vert-1":0,"signals-hide-edit-1":false,"signals-cond-2":"==","signals-val-2":true,"signals-icon-2":"/vis/signals/lowbattery.png","signals-icon-size-2":0,"signals-blink-2":false,"signals-horz-2":0,"signals-vert-2":0,"signals-hide-edit-2":false,"html":"<span style=\"font-size: 80%; padding: 0 20px 0 5px;\">Diesel</span>{tankerkoenig.0.stations.0.diesel.combined}"},"style":{"left":"634px","top":"745px","z-index":"20","width":"228px","height":"36px","background-color":"","color":"rgba(225,225,225,1)","font-size":"30px","text-align":"center","background":"rgba(250,0,0,0.1)"},"widgetSet":"basic"}]
```
Der Inhalt des Datenpunktes `combined` wird mit einer CSS-Klasse übergeben. Die Klassen sind `station_open`,`station_closed` und `station_notfound`. Durch die Verwendung von CSS-Definitionen im VIS Editor können so (nicht nur farblich) unterschiedliche Darstellungen für die Zustände "geöffnet" (zB normal), "geschlossen" (zB rote Schrift) und "nicht gefunden" (zB gelbe Schrift) erzielt werden.
```css
.station_open {
    color: blue; 
}
.station_closed {
    color: red !important; /* !important kann ggf. weggelassen werden */
}
.station_notfound {
    color: yellow !important; /* !important kann ggf. weggelassen werden */
}
.station_no_prices {
    color: yellow !important; /* !important kann ggf. weggelassen werden */
}

/* € sign */
.station_combined_euro {
    font-family: Times;
    font-size: 80%;
}
```
