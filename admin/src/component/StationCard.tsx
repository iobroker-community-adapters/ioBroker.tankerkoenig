/**
 * Created by alex-issi on 29.05.22
 */
import { Delete, Edit, LocalGasStationTwoTone } from '@mui/icons-material';
import { Box, Card, CardActions, CardContent, Grid, IconButton, Tooltip, Typography } from '@mui/material';
import { green, red } from '@mui/material/colors';
import { useI18n, useIoBrokerTheme } from 'iobroker-react/hooks';
import React from 'react';

export interface StationCardProps {
	item: ioBroker.Station;
	index: number;
	editModal: (value: { open: boolean; index: number | null; oldRow?: ioBroker.Station }) => void;
	deleteModal: (id: string) => void;
}

export const StationCard: React.FC<StationCardProps> = ({
	item,
	index,
	editModal,
	deleteModal,
}): JSX.Element => {
	const { translate: _ } = useI18n();
	const [themeName] = useIoBrokerTheme();

	const handleBackgroundColor = () => {
		if (themeName === 'dark') {
			return {
				color: '#f0f0f0',
				cardAction: '#211f1f',
				gradientStart: '#5D5B5BFF',
				gradientEnd: '#2F2D2DFF',
			};
		} else if (themeName === 'blue') {
			return {
				color: '#f0f0f0',
				cardAction: '#1a2426',
				gradientStart: '#415157',
				gradientEnd: '#1e262a',
			};
		} else {
			return {
				color: '#303030',
				cardAction: '#5d5b5b',
				gradientStart: '#cbcbcb',
				gradientEnd: '#726b6b',
			};
		}
	};

	const discountColor = () => {
		if (item.discounted) {
			if (themeName === 'dark') {
				return green[600];
			} else if (themeName === 'blue') {
				return green[600];
			}
			return green[900];
		} else {
			if (themeName === 'dark') {
				return red[500];
			} else if (themeName === 'blue') {
				return red[500];
			}
			return red[900];
		}
	};

	return (
		<Card
			sx={{
				margin: '10px',
				padding: '10px',
				width: '480px',
				height: '500px',
				maxWidth: '500px',
				maxHeight: '500px',
				borderRadius: '20px',
				boxShadow: '0px 0px 10px 0px rgba(0,0,0,0.75)',
				color: handleBackgroundColor().color,
				backgroundImage: `linear-gradient(to right, ${handleBackgroundColor().gradientStart}, ${
					handleBackgroundColor().gradientEnd
				})`,
			}}
		>
			<CardContent
				sx={{
					margin: '5 5 0 5',
					height: '50px',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-around',
					borderRadius: '15px 15px 0px 0px',
					borderTop: '2.5px solid',
					borderRight: '2.5px solid',
					borderLeft: '2.5px solid',
					borderColor: '#000000',
					padding: '5 50 0 50',
				}}
			>
				<LocalGasStationTwoTone
					sx={{
						fontSize: '40px',
					}}
				/>
				<Typography
					variant="h5"
					maxWidth={'md'}
					sx={{
						fontSize: '20px',
					}}
				>
					{item.stationname}
				</Typography>

				<LocalGasStationTwoTone
					sx={{
						fontSize: '40px',
					}}
				/>
			</CardContent>
			<CardContent
				sx={{
					height: '122px',
					paddingTop: '0px',
					paddingBottom: '0px',
					borderRight: '2.5px solid',
					borderLeft: '2.5px solid',
					margin: '0 5 0 5',
					borderColor: 'black',
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					alignContent: 'flex-end',
					flexWrap: 'wrap',
					fontSize: '1rem',
				}}
			>
				<Box
					sx={{
						width: '100%',
						height: '75%',
						display: 'flex',
						justifyContent: 'space-around',
						flexWrap: 'wrap',
						alignItems: 'center',
						flexDirection: 'row',
						border: '2.5px solid',
						borderBottom: '0 solid',
						borderColor: 'divider',
						borderRadius: '15px 15px 0 0',
					}}
				>
					<Typography
						variant={'body1'}
						sx={{
							fontSize: '1.5rem',
							margin: '0 5 10 5',
						}}
					>
						{_('station_id')}
					</Typography>
					<Typography
						variant={'h6'}
						sx={{
							fontWeight: 'bold',
						}}
					>
						{item.station}
					</Typography>
				</Box>
			</CardContent>
			<CardContent
				sx={{
					height: '238px',
					paddingTop: '0px',
					paddingBottom: '0px',
					borderRight: '2.5px solid',
					borderLeft: '2.5px solid',
					margin: '0 5 0 5',
					borderColor: 'black',
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					alignContent: 'flex-start',
					flexWrap: 'wrap',
					fontSize: '1rem',
				}}
			>
				<Box
					sx={{
						width: '100%',
						border: '2.5px solid',
						borderBottom: '0 solid',
						borderColor: 'divider',
						display: 'flex',
						justifyContent: 'space-around',
					}}
				>
					<Typography
						variant={'body1'}
						sx={{
							fontSize: '1.5rem',
							margin: '0 5 10 5',
						}}
					>
						{_('discountOptions')}
					</Typography>
				</Box>
				<Box
					sx={{
						width: '100%',
						height: '180px',
						display: 'flex',
						justifyContent: 'space-around',
						flexWrap: 'wrap',
						alignItems: 'center',
						flexDirection: 'column',
						border: '2.5px solid',
						borderTop: '0 solid',
						borderColor: 'divider',
						borderRadius: '0px 0px 15px 15px',
					}}
				>
					<Grid
						container={true}
						spacing={2}
						sx={{
							display: 'flex',
							justifyContent: 'center',
							flexWrap: 'wrap',
							alignItems: 'center',
							flexDirection: 'row',
							width: '100%',
						}}
					>
						<Grid
							item={true}
							xs={5}
							sx={{
								display: 'flex',
								justifyContent: 'space-around',
							}}
						>
							<Typography
								variant={'h5'}
								sx={{
									color: discountColor(),
									fontWeight: 'bold',
								}}
							>
								{_('discount') + ':'}
							</Typography>
						</Grid>
						<Grid item={true} xs={7}>
							<Typography
								variant={'h5'}
								sx={{
									color: discountColor(),
									fontWeight: 'bold',
								}}
								align={'center'}
							>
								{item.discounted ? _('activate') : _('deactivate')}
							</Typography>
						</Grid>
						{item.discounted ? (
							<React.Fragment>
								<Grid
									item={true}
									xs={5}
									sx={{
										display: 'flex',
										justifyContent: 'space-around',
									}}
								>
									<Typography
										variant={'h5'}
										sx={{
											color: discountColor(),
											fontWeight: 'bold',
										}}
									>
										{_('fuelType') + ':'}
									</Typography>
								</Grid>
								<Grid item={true} xs={7}>
									<Typography
										variant={'h5'}
										sx={{
											color: discountColor(),
											fontWeight: 'bold',
										}}
										align={'center'}
									>
										{item.discountObj.fuelType.join(', ')}
									</Typography>
								</Grid>
								<Grid
									item={true}
									xs={5}
									sx={{
										display: 'flex',
										justifyContent: 'space-around',
									}}
								>
									<Typography
										variant={'h5'}
										sx={{
											color: discountColor(),
											fontWeight: 'bold',
										}}
									>
										{_('discountType') + ':'}
									</Typography>
								</Grid>
								<Grid item={true} xs={7}>
									<Typography
										variant={'h5'}
										sx={{
											color: discountColor(),
											fontWeight: 'bold',
										}}
										align={'center'}
									>
										{item.discountObj.discountType === 'percent'
											? _('percent')
											: _('euro')}
									</Typography>
								</Grid>
								<Grid
									item={true}
									xs={5}
									sx={{
										display: 'flex',
										justifyContent: 'space-around',
									}}
								>
									<Typography
										variant={'h5'}
										sx={{
											color: discountColor(),
											fontWeight: 'bold',
										}}
									>
										{_('discount') + ':'}
									</Typography>
								</Grid>
								<Grid item={true} xs={7}>
									<Typography
										variant={'h5'}
										sx={{
											color: discountColor(),
											fontWeight: 'bold',
										}}
										align={'center'}
									>
										{item.discountObj.discountType === 'percent'
											? item.discountObj.discount + ' %'
											: item.discountObj.discount + ' €'}
									</Typography>
								</Grid>
							</React.Fragment>
						) : null}
					</Grid>
				</Box>
			</CardContent>
			<CardActions
				disableSpacing
				sx={{
					display: 'flex',
					justifyContent: 'space-around',
					margin: '0 5 5 5',
					borderRadius: '0px 0px 15px 15px',
					borderTop: '1.5px solid',
					borderRight: '2.5px solid',
					borderLeft: '2.5px solid',
					borderBottom: '2.5px solid',
					borderColor: '#000000',
					backgroundColor: handleBackgroundColor().cardAction,
				}}
			>
				<React.Fragment>
					<Tooltip title={_('editModal')} arrow enterNextDelay={500} enterDelay={500}>
						<IconButton
							onClick={() => {
								editModal({ open: true, index, oldRow: item });
							}}
							size="small"
							color="primary"
						>
							<Edit />
						</IconButton>
					</Tooltip>
					<Tooltip title={_('delete')} arrow enterNextDelay={500} enterDelay={500}>
						<IconButton
							sx={{
								color: red[500],
							}}
							onClick={() => deleteModal(item.station)}
						>
							<Delete />
						</IconButton>
					</Tooltip>
				</React.Fragment>
			</CardActions>
		</Card>
	);
};
