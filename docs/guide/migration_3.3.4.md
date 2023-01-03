## Adapter Migration

## Update von 3.3.3 auf 3.3.4 deutsch :de:
Bei dem Update wurde die Postleitzahl von Nummer auf Text umgestellt.\
Da in der Adapter config die Postleitzahl als Nummer gespeichert wurde, wird beim Adapter Start eine Warnung angezeigt.\
![img_4.png](img_4.png)\
Um die Warnung zu beheben, muss die Postleitzahl in der Adapter config geändert werden.\
Vorgehensweise:
* in die UI des Adapters gehen
* auf den Tab `Stationen` gehen
* auf den Button `Bearbeiten` klicken
* die Postleitzahl in der Zeile `Postleitzahl` neu eingeben
* auf den Button `Hinzufügen` klicken
* Auf den Button `Speichern` klicken

Nach dem Speichern startet der Adapter neu und die Warnung sollte nicht mehr angezeigt werden.

## update from 3.3.3 to 3.3.4 english :gb:
During the update the postal code was changed from number to text.\
Because in the adapter config the zip code was saved as number, a warning is displayed at adapter startup.\
![img_4.png](img_4.png)\
To fix the warning, the postal code must be changed in the adapter config.\
Procedure:
* go to the UI of the adapter
* go to the tab `Stations`.
* click on the `Edit` button
* re-enter the postal code in the line `Postcode`.
* click on the `Add` button
* click on the `Save` button.

After saving, the adapter will restart and the warning should no longer be displayed.
