/**
 * Created by alex-issi on 06.06.22
 */
import { Box, Typography } from '@mui/material';
import { useI18n } from 'iobroker-react/hooks';
import React from 'react';

export const StationFinder = (): JSX.Element => {
	const { translate: _ } = useI18n();

	return (
		<React.Fragment>
			<Box
				alignItems={'center'}
				sx={{
					width: '100%',
					display: 'flex',
					justifyContent: 'center',
					marginLeft: '10px',
					flexDirection: 'column',
				}}
			>
				<Typography gutterBottom sx={{ fontWeight: 'bold', fontSize: '22px' }} align={'center'}>
					{_(`stationFinder`)}
				</Typography>
				<iframe
					src="https://creativecommons.tankerkoenig.de/TankstellenFinder/index.html"
					width="568"
					height="450"
					seamless={true}
				/>
			</Box>
		</React.Fragment>
	);
};
