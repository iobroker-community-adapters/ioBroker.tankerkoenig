import Utils from '@iobroker/adapter-react/Components/Utils';
import theme from '@iobroker/adapter-react/Theme';
// UI elements are imported from Material-UI
import { ThemeProvider } from '@mui/material/styles';
// import from iobroker-react docu page => https://github.com/AlCalzone/iobroker-react
import { SettingsApp } from 'iobroker-react/app';
import { useSettings } from 'iobroker-react/hooks';
import type { Translations } from 'iobroker-react/i18n';
import React from 'react';
import ReactDOM from 'react-dom';
import { SettingPage } from './SettingPage';

// Components are imported here

const themeName = Utils.getThemeName();

// eslint-disable-next-line react/display-name
const SettingsPageContent: React.FC = React.memo(() => {
	// settings is the current settings object, including the changes made in the UI
	// originalSettings is the original settings object, as it was loaded from ioBroker
	// setSettings is used to update the current settings object
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { settings, originalSettings, setSettings } = useSettings<ioBroker.AdapterConfig>();

	// Updates the settings when the checkbox changes. The changes are not saved yet.
	const handleChange = <T extends keyof ioBroker.AdapterConfig>(
		option: T,
		value: ioBroker.AdapterConfig[T],
	) => {
		setSettings((s) => ({
			...s,
			[option]: value,
		}));
	};

	return (
		<React.Fragment>
			<SettingPage settings={settings} onChange={(option?, value?) => handleChange(option, value)} />
		</React.Fragment>
	);
});

const migrateSettings = (settings: ioBroker.AdapterConfig) => {
	// Here's an example for editing settings after they are loaded from the backend
	// In this case, option1 will be set to true by default
	if (settings.apikey === undefined) {
		settings.apikey = '';
	}
	if (settings.synctime === undefined) {
		settings.synctime = 5;
	}
	if (settings.noLogs === undefined) {
		settings.noLogs = true;
	}
	if (settings.resetValues === undefined) {
		settings.resetValues = false;
	}
	if (settings.station === undefined) {
		settings.station = [];
	}
};

// Load your translations
const translations: Translations = {
	en: require('./i18n/en.json'),
	de: require('./i18n/de.json'),
	ru: require('./i18n/ru.json'),
	pt: require('./i18n/pt.json'),
	nl: require('./i18n/nl.json'),
	fr: require('./i18n/fr.json'),
	it: require('./i18n/it.json'),
	es: require('./i18n/es.json'),
	pl: require('./i18n/pl.json'),
	'zh-cn': require('./i18n/zh-cn.json'),
};

const Root: React.FC = () => {
	return (
		<ThemeProvider theme={theme(themeName)}>
			<SettingsApp name="tankerkoenig" afterLoad={migrateSettings} translations={translations}>
				<SettingsPageContent />
			</SettingsApp>
		</ThemeProvider>
	);
};

ReactDOM.render(<Root />, document.getElementById('root'));
