/**
 * Created by alex-issi on 05.05.22
 */
import { Box, FormControl, Grid, Typography } from '@mui/material';
import { useI18n } from 'iobroker-react/hooks';
import React from 'react';
import { NumberInput } from './NumberInput';

export interface AdapterIntervalProps {
	onChange: (key: keyof ioBroker.AdapterConfig, value: any) => void;
	settings: ioBroker.AdapterConfig;
}

export const AdapterInterval: React.FC<AdapterIntervalProps> = ({ settings, onChange }): JSX.Element => {
	const { translate: _ } = useI18n();
	const handeleNumber = (attr: string, value: React.SetStateAction<number | undefined>): void => {
		if (typeof value === 'number') {
			onChange('synctime', value);
		}
	};

	return (
		<React.Fragment>
			<Box sx={{ minWidth: 200 }}>
				<Grid container spacing={2}>
					<Grid
						item
						xs={6}
						sx={{
							display: 'flex',
							flexDirection: 'row',
							flexWrap: 'wrap',
							alignContent: 'center',
							alignItems: 'center',
							justifyContent: 'center',
						}}
					>
						<FormControl
							fullWidth
							sx={{
								alignItems: 'center',
							}}
						>
							<NumberInput
								min={5}
								max={999}
								defaultValue={5}
								label={'interval'}
								tooltip={'intervalTooltip'}
								sx={{ width: '200', textAlignLast: 'center' }}
								value={settings.synctime}
								onChange={(value) => handeleNumber('synctime', value)}
							/>
							<Typography
								variant="inherit"
								color="textSecondary"
								sx={{
									pt: 0.5,
									pl: 0.5,
									fontSize: '1rem',
								}}
							>
								{_('helperText')}
							</Typography>
						</FormControl>
					</Grid>
					<Grid
						item
						xs={6}
						sx={{
							display: 'flex',
							flexDirection: 'row',
							flexWrap: 'wrap',
							alignContent: 'center',
							alignItems: 'center',
							justifyContent: 'center',
						}}
					>
						<Typography variant="h6" align={'center'}>
							{_('intervalInfo')}
						</Typography>
					</Grid>
				</Grid>
			</Box>
		</React.Fragment>
	);
};
