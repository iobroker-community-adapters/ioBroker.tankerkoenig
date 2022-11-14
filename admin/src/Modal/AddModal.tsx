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
import { AddStationDialog } from '../component/AddStationDialog';
import { StationFinder } from '../component/StationFinder';

export interface AddModalProps {
	newRow: (value: ioBroker.Station) => void;
	currentRows: ioBroker.Station[];
	open: boolean;
	onClose: () => void;
}
let resetTimeout: NodeJS.Timeout;
export const AddModal: React.FC<AddModalProps> = ({ newRow, open, onClose, currentRows }): JSX.Element => {
	const [row, setRow] = useState<ioBroker.Station>();
	const [validConfig, setValidConfig] = useState<{
		valid: boolean;
		message: string;
		alert: boolean;
	}>({
		valid: false,
		alert: false,
		message: '',
	});

	const { translate: _ } = useI18n();

	const handleClickAdd = (): void => {
		if (row) {
			newRow(row);
			onClose();
		}
	};

	const handleClose = async (): Promise<void> => {
		onClose();
	};

	// check if in the current row id and name are set  and if the id and name is not already in the list
	const checkValidConfig = (row: ioBroker.Station) => {
		const max = 36;
		const pattern = /[0-9|a-z]{8}\-[0-9|a-z]{4}\-[0-9|a-z]{4}\-[0-9|a-z]{4}\-[0-9|a-z]{12}/g;
		// check if the id is a valid uuid
		if (row.station && row.station.match(pattern) && row.station.length === max) {
			if (row.stationname && row.stationname.length > 0) {
				// check if the id is not already in the list
				if (currentRows.find((element) => element.station === row.station)) {
					// id is already in the list
					setValidConfig({
						...validConfig,
						valid: false,
						alert: true,
						message: _('id already in list'),
					});
				} else {
					// id is not in the list
					setValidConfig({ ...validConfig, valid: true, alert: false, message: '' });
				}
			} else {
				// name is not set
				setValidConfig({ ...validConfig, valid: false, alert: true, message: _('name is empty') });
			}
		} else {
			// id is not a valid uuid
			setValidConfig({ ...validConfig, valid: false, alert: true, message: _('id not valid') });
		}
	};

	// reset validConfig by open the modal
	useEffect(() => {
		if (resetTimeout) clearTimeout(resetTimeout);
		resetTimeout = setTimeout(() => {
			if (open) {
				setValidConfig({ ...validConfig, valid: false, alert: false, message: '' });
			}
		}, 10);
	}, [open]);

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
			<Dialog open={open} onClose={handleClose}>
				<DialogTitle
					sx={{
						textAlignLast: 'center',
						fontSize: '1.4rem',
					}}
				>
					{_('addNewStation ')}
				</DialogTitle>
				<DialogContent
					sx={{
						display: 'flex',
						flexWrap: 'wrap',
						flexDirection: 'row',
						justifyContent: 'center',
					}}
				>
					{validConfig.alert && !validConfig.valid ? (
						<Alert severity="warning">
							<AlertTitle>Warning</AlertTitle>
							{validConfig.message}
						</Alert>
					) : null}
					<Grid container spacing={1}>
						<AddStationDialog
							addRow={(value) => {
								setRow(value);
								checkValidConfig(value);
							}}
						/>
						<StationFinder />
					</Grid>
				</DialogContent>

				<DialogActions>
					<Button disabled={!validConfig.valid} onClick={handleClickAdd}>
						{_('add')}
					</Button>
					<Button onClick={handleClose}>{_('cancel')}</Button>
				</DialogActions>
			</Dialog>
		</React.Fragment>
	);
};
