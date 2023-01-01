import {
	Alert,
	AlertTitle,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Grid,
} from '@mui/material';
import { useI18n } from 'iobroker-react/hooks';
import React, { useEffect, useState } from 'react';
import { EditTableDialog } from '../component/EditTableDialog';
import { StationFinder } from '../component/StationFinder';

export interface EditModalProps {
	alive: boolean;
	newRow: (value: ioBroker.Station, index: number | null) => void;
	oldRow: ioBroker.Station | undefined;
	currentRows: ioBroker.Station[] | undefined;
	index: number | null;
	open: boolean;
	onClose: () => void;
}
let timer: NodeJS.Timeout;
export const EditModal: React.FC<EditModalProps> = ({
	alive,
	currentRows,
	newRow,
	index,
	open,
	oldRow,
	onClose,
}): JSX.Element => {
	const [row, setRow] = useState<ioBroker.Station>();
	const { translate: t } = useI18n();
	const [validConfig, setValidConfig] = useState<{
		message: string;
		open: boolean;
	}>({
		open: false,
		message: '',
	});
	const [valid, setValid] = useState<boolean>(true);
	const handleClickAdd = (row: ioBroker.Station | undefined): void => {
		if (row) {
			newRow(row, index);
			onClose();
		}
	};
	const handleClose = async (): Promise<void> => {
		onClose();
	};
	// prüfe ob die station schon in der liste ist
	const checkStation = (row: ioBroker.Station): void => {
		setValidConfig({
			open: false,
			message: '',
		});
		const max = 36;
		const pattern = /[0-9|a-z]{8}\-[0-9|a-z]{4}\-[0-9|a-z]{4}\-[0-9|a-z]{4}\-[0-9|a-z]{12}/g;
		// check if the id is a valid uuid
		if (row.station && row.station.match(pattern) && row.station.length === max) {
			if (row.stationname && row.stationname.length > 0) {
				// check if the id is not already in the list
				if (currentRows) {
					if (currentRows.find((element) => element.station === row.station)) {
						// check if it is the same station
						if (oldRow) {
							if (oldRow.station === row.station) {
								setValid(true);
								setValidConfig({
									open: false,
									message: '',
								});
								console.log('same station');
							} else {
								setValidConfig({
									open: true,
									message: t('station_already_in_list'), // 'Station is already in the list',
								});
								setValid(false);
								console.warn(t('station_already_in_list'));
							}
						}
						// id is already in the list
					} else {
						// id is not in the list
						setValidConfig({
							open: false,
							message: '',
						});
						setValid(true);
					}
				}
			} else {
				// name is not set
				setValidConfig({
					open: true,
					message: t('station_name_not_set'),
				});
				setValid(false);
				console.warn(t('station_name_not_set'));
			}
		} else {
			// id is not a valid uuid
			setValidConfig({
				open: true,
				message: t('station_id_not_valid'),
			});
			setValid(false);
			console.warn(t('station_id_not_valid'));
		}
	};
	useEffect(() => {
		// reset the valid state and the validConfig by opening the modal
		setValid(true);
		setValidConfig({
			open: false,
			message: '',
		});
	}, [open]);

	useEffect(() => {
		if (validConfig.message === t('station_id_not_valid')) {
			if (timer) clearTimeout(timer);
			timer = setTimeout(() => {
				setValidConfig({
					open: false,
					message: '',
				});
			}, 10000);
		}
	}, [validConfig]);

	return (
		<React.Fragment>
			<Grid
				container
				spacing={3}
				sx={{
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'space-around',
					alignItems: 'center',
				}}
			></Grid>
			<Dialog
				open={open}
				onClose={handleClose}
				sx={{
					'& .MuiDialog-paper': {
						maxWidth: '650px',
					},
				}}
			>
				<DialogTitle
					sx={{
						textAlignLast: 'center',
						fontSize: '1.4rem',
					}}
				>
					{t('editStation')}
				</DialogTitle>
				{alive ? (
					<DialogContent
						sx={{
							display: 'flex',
							flexWrap: 'wrap',
							flexDirection: 'row',
							justifyContent: 'center',
						}}
					>
						<Grid container spacing={1}>
							<EditTableDialog
								editRow={(value) => {
									setRow(value);
									checkStation(value);
								}}
								oldRow={oldRow}
								checkAlert={{ open: validConfig.open, message: validConfig.message }}
							/>
							<StationFinder />
						</Grid>
					</DialogContent>
				) : (
					<DialogContent
						sx={{
							display: 'flex',
							flexWrap: 'wrap',
							flexDirection: 'row',
							justifyContent: 'center',
						}}
					>
						<Alert variant="filled" severity="warning">
							<AlertTitle>Warning</AlertTitle>
							{t('adapterOffline')}
						</Alert>
					</DialogContent>
				)}

				<DialogActions>
					<Button disabled={!alive || !valid} onClick={() => handleClickAdd(row)}>
						{t('add')}
					</Button>
					<Button onClick={handleClose}>{t('cancel')}</Button>
				</DialogActions>
			</Dialog>
		</React.Fragment>
	);
};
