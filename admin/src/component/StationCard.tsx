/**
 * Created by alex-issi on 29.05.22
 */
import { Delete, Edit, LocalGasStationTwoTone } from '@mui/icons-material';
import { Box, Card, CardActions, CardContent, IconButton, Tooltip, Typography } from '@mui/material';
import { red } from '@mui/material/colors';
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

	return (
		<Card
			sx={{
				margin: '10px',
				padding: '10px',
				width: '430px',
				height: '262px',
				maxWidth: '450px',
				maxHeight: '305px',
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
				<Typography variant="h5" maxWidth={'md'}>
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
						borderColor: 'divider',
						borderRadius: '15px',
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
					<Typography variant={'body1'}>{item.station}</Typography>
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
					<Tooltip title={_('editModal')}>
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
					<Tooltip title={_('delete')}>
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
