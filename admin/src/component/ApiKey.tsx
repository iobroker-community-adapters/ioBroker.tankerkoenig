/**
 * Created by alex-issi on 04.06.22
 */
import { Link, Typography } from '@mui/material';
import { useGlobals, useI18n, useIoBrokerObject } from 'iobroker-react/hooks';
import React, { useEffect, useMemo, useState } from 'react';
import { PasswordInput } from 'iobroker-react';
import { decrypt, encrypt } from 'iobroker-react/lib/shared/tools';

export interface ApiKeyProps {
	secret: string;
	settings: ioBroker.AdapterConfig;
	onChange: (key: keyof ioBroker.AdapterConfig, value: any) => void;
}

const pattern = /[0-9|a-z]{8}\-[0-9|a-z]{4}\-[0-9|a-z]{4}\-[0-9|a-z]{4}\-[0-9|a-z]{12}/g;

export const ApiKey: React.FC<ApiKeyProps> = ({ secret, settings, onChange }): JSX.Element => {
	const { translate: t } = useI18n();
	const { namespace } = useGlobals();
	const [instanceObj, , setInstanceObj] = useIoBrokerObject(`system.adapter.${namespace}`);
	const [apiKey, setApiKey] = useState(settings.apikey);
	const [error, setError] = useState(true);
	const [valid, setValid] = useState(false);

	const handleChange = (value: string) => {
		setApiKey(value);
	};

	const handleValidate = (value: string) => {
		if (value) {
			if (value.match(pattern)) {
				if (secret) {
					setValid(true);
					setError(false);
					onChange('apikey', encrypt(secret, value));
				}
			} else {
				setValid(false);
				setError(true);
			}
		} else {
			if (value === '') {
				setValid(false);
				setError(true);
				onChange('apikey', value);
			}
		}
	};

	/*
	 * added in Version 3.2.2
	 */
	const encryptOldApiKey = async () => {
		if (secret) {
			console.log('API key is not encrypted');
			console.log('Encryption is started');
			if (instanceObj) {
				const newSettings: Record<string, any> = { ...instanceObj.native };
				setApiKey(settings.apikey);
				newSettings.apikey = encrypt(secret, newSettings.apikey);
				const newInstanceObj = {
					...instanceObj,
					native: newSettings,
				};
				console.log('writing new settings');
				await setInstanceObj(newInstanceObj);
				console.log('API key is encrypted');
			}
		}
	};

	useMemo(() => {
		if (secret) {
			setApiKey(decrypt(secret, apiKey));
		}
	}, [secret]);

	useEffect(() => {
		if (settings.apikey && settings.apikey.match(pattern)) {
			encryptOldApiKey();
		}
		handleValidate(apiKey);
	}, [apiKey]);

	return (
		<React.Fragment>
			<PasswordInput
				label={t('API_Key_Label')}
				variant={'standard'}
				value={apiKey}
				onChange={(value) => {
					handleChange(value);
				}}
				error={error}
				placeholder={'ab345678-ab34-ab34-ab34-ab3456789012'}
				helperText={error ? t('wrong') : t('good')}
				colors={{
					color: valid ? 'success' : 'error',
				}}
				sx={{
					input: {
						width: '40ch',
						fontSize: 'x-large',
						textAlignLast: 'center',
					},
					inputLabel: {
						fontSize: 'large',
					},
				}}
				inputProps={{
					maxLength: 36,
				}}
				tooltip={{
					title: t('API_Key_Tooltip'),
					placement: 'top',
					arrow: true,
					enterDelay: 200,
					enterNextDelay: 200,
				}}
			/>
			<Typography
				variant="body2"
				sx={{
					fontSize: '1.3rem',
				}}
			>
				{t('API_Key_Link')}{' '}
				<Link href="https://creativecommons.tankerkoenig.de/#register" target="_blank">
					Tankerkönig.de
				</Link>
			</Typography>
		</React.Fragment>
	);
};
