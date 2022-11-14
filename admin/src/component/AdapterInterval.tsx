/**
 * Created by alex-issi on 05.05.22
 */
import { Box, FormControl, Grid, Typography } from '@mui/material';
import { useI18n } from 'iobroker-react/hooks';
import React from 'react';
// import { NumberInput } from './NumberInput';
import { NumberInput } from 'iobroker-react/components';

export interface AdapterIntervalProps {
	onChange: (key: keyof ioBroker.AdapterConfig, value: any) => void;
	settings: ioBroker.AdapterConfig;
}

export const AdapterInterval: React.FC<AdapterIntervalProps> = ({ settings, onChange }): JSX.Element => {
	const { translate: _ } = useI18n();
	const [values, setValues] = React.useState<number>(settings.synctime ?? 5);
	const handeleNumber = (value: React.SetStateAction<number>): void => {
		if (typeof value === 'number') {
			setValues(value);
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
								value={values}
								label={'Interval'}
								sx={{
									input: { width: '150', textAlignLast: 'center' },
								}}
								unit={'min'}
								onChange={handeleNumber}
								tooltip={{
									title: _('intervalTooltip'),
									arrow: true,
								}}
							/>
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
