/**
 * Created by alex-issi on 04.06.22
 */
import { FormControl, Link, TextField, Tooltip, Typography } from '@mui/material';
import { useI18n } from 'iobroker-react/hooks';
import React, { useEffect, useState } from 'react';

export interface ApiKeyProps {
	settings: ioBroker.AdapterConfig;
	onChange: (key: keyof ioBroker.AdapterConfig, value: any) => void;
	//props
}

const max = 36;
const pattern = /[0-9|a-z]{8}\-[0-9|a-z]{4}\-[0-9|a-z]{4}\-[0-9|a-z]{4}\-[0-9|a-z]{12}/g;

export const ApiKey: React.FC<ApiKeyProps> = ({ settings, onChange }): JSX.Element => {
	const { translate: _ } = useI18n();
	const [apiKey, setApiKey] = useState(settings.apikey);
	const [error, setError] = useState(true);
	const [valid, setValid] = useState(false);

	const handleChange = (event: { target: { value: React.SetStateAction<string> } }) => {
		setApiKey(event.target.value);
	};

	const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
		const apiKey = event.clipboardData.getData('text');
		if (apiKey.length > max) {
			setApiKey(apiKey.substring(0, max));
		} else {
			setApiKey(apiKey);
		}
	};

	const handleValidate = (value: string) => {
		if (value) {
			if (value.match(pattern)) {
				setValid(true);
				setError(false);
				onChange('apikey', value);
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

	useEffect(() => {
		handleValidate(apiKey);
	}, [apiKey]);

	return (
		<React.Fragment>
			<Tooltip
				title={_('tooltipApiKey')}
				arrow
				placement={'right'}
				enterNextDelay={500}
				enterDelay={500}
			>
				<FormControl error={error} color={valid ? 'success' : 'error'} variant="standard">
					<TextField
						error={error}
						color={valid ? 'success' : 'error'}
						value={apiKey}
						id="apiKey-input"
						label={_('tankerkoenig API')}
						variant="standard"
						onPaste={handlePaste}
						onChange={handleChange}
						helperText={error ? _('wrong') : _('good')}
						placeholder={'ab345678-ab34-ab34-ab34-ab3456789012'}
						inputProps={{ maxLength: 36 }}
						InputProps={{
							style: {
								fontSize: '1.7rem',
							},
						}}
						sx={{
							width: '40ch',
							fontSize: '1.7rem',
						}}
					/>
				</FormControl>
			</Tooltip>
			<Typography
				variant="body2"
				sx={{
					fontSize: '1.3rem',
				}}
			>
				{_('APIKeyLink')}{' '}
				<Link href="https://creativecommons.tankerkoenig.de/#register" target="_blank">
					Tankerkönig.de
				</Link>
			</Typography>
		</React.Fragment>
	);
};
