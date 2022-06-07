/**
 * Created by alex-issi on 06.06.22
 */
import { Checkbox, FormControlLabel, Stack, Typography } from '@mui/material';
import { orange } from '@mui/material/colors';
import { useI18n } from 'iobroker-react/hooks';
import React from 'react';

export interface LogSettingsProps {
	onChange: (key: keyof ioBroker.AdapterConfig, value: any) => void;
	settings: ioBroker.AdapterConfig;
	//props
}

export const LogSettings: React.FC<LogSettingsProps> = ({ onChange, settings }): JSX.Element => {
	const { translate: _ } = useI18n();
	const [noLogs, setNoLogs] = React.useState(settings.noLogs);

	const handleChangeNoLogs = (event: React.ChangeEvent<HTMLInputElement>) => {
		setNoLogs(event.target.checked);
		onChange('noLogs', event.target.checked);
	};
	return (
		<React.Fragment>
			<Stack
				spacing={2}
				sx={{
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
				}}
			>
				<FormControlLabel
					sx={{ fontSize: '1.3rem' }}
					control={
						<Checkbox
							checked={noLogs}
							onChange={handleChangeNoLogs}
							color="success"
							sx={{ '& .MuiSvgIcon-root': { fontSize: 28 } }}
							inputProps={{ 'aria-label': 'noLogs' }}
						/>
					}
					label={_('No logs')}
				/>
				<Typography
					variant="h6"
					gutterBottom
					align="center"
					sx={{
						color: orange[500],
					}}
				>
					{_('No logs info')} <br />
					{_('No logs info2')}
				</Typography>
			</Stack>
		</React.Fragment>
	);
};
