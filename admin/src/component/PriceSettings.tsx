/**
 * Created by alex-issi on 04.06.22
 */
import { Checkbox, FormControlLabel, Stack, Typography } from '@mui/material';
import { orange } from '@mui/material/colors';
import { useI18n } from 'iobroker-react/hooks';
import React from 'react';

export interface PriceSettingsProps {
	onChange: (key: keyof ioBroker.AdapterConfig, value: any) => void;
	settings: ioBroker.AdapterConfig;
	//props
}

export const PriceSettings: React.FC<PriceSettingsProps> = ({ onChange, settings }): JSX.Element => {
	const { translate: _ } = useI18n();
	const [resetValues, setResetValues] = React.useState(settings.resetValues);

	const handleChangeResetValues = (event: React.ChangeEvent<HTMLInputElement>) => {
		setResetValues(event.target.checked);
		onChange('resetValues', event.target.checked);
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
					sx={{ fontSize: '1.3rem', maxWidth: '520px' }}
					control={
						<Checkbox
							checked={resetValues}
							color="success"
							sx={{ '& .MuiSvgIcon-root': { fontSize: 28 } }}
							onChange={handleChangeResetValues}
						/>
					}
					label={_('Reset values')}
				/>
				<Typography
					variant="h6"
					gutterBottom
					align="center"
					sx={{
						color: orange[500],
					}}
				>
					{_('Reset values info')} <br />
					{_('Reset values info2')} <br />
					{_('Reset values info3')}
				</Typography>
			</Stack>
		</React.Fragment>
	);
};
