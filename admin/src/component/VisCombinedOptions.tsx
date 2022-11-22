/**
 * Created by alex-issi on 05.05.22
 */
import { Box, Button, FormControl, Grid, Typography } from '@mui/material';
import { useI18n } from 'iobroker-react/hooks';
import React from 'react';
import { VisCombinedOptionsModal } from '../Modal/VisCombinedOptionsModal';

export interface VisCombinedOptionsProps {
	onChange: (
		key: keyof ioBroker.AdapterConfig,
		value: { closed: string; notFound: string; noPrice: string },
	) => void;
	settings: ioBroker.AdapterConfig;
}

export const VisCombinedOptions: React.FC<VisCombinedOptionsProps> = ({
	settings,
	onChange,
}): JSX.Element => {
	const { translate: t } = useI18n();
	const [open, setOpen] = React.useState(false);

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
							<Button variant={'contained'} onClick={() => setOpen(true)}>
								{t('combined_settings')}
							</Button>
							<VisCombinedOptionsModal
								onChange={(key, value) => onChange(key, value)}
								native={settings}
								open={open}
								onClose={() => setOpen(false)}
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
							{t('combinedInfo')}
						</Typography>
					</Grid>
				</Grid>
			</Box>
		</React.Fragment>
	);
};
