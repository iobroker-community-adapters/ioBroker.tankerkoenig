import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid } from '@mui/material';
import { useI18n } from 'iobroker-react/hooks';
import React, { useState } from 'react';
import { AddStationDialog } from '../component/AddStationDialog';
import { StationFinder } from '../component/StationFinder';

export interface AddModalProps {
	newRow: (value: ioBroker.Station) => void;
	currentRows: ioBroker.Station[];
	open: boolean;
	onClose: () => void;
}

export const AddModal: React.FC<AddModalProps> = ({ newRow, open, onClose }): JSX.Element => {
	const [row, setRow] = useState<ioBroker.Station>();

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
					<Grid container spacing={1}>
						<AddStationDialog addRow={(value) => setRow(value)} />
						<StationFinder />
					</Grid>
				</DialogContent>

				<DialogActions>
					<Button onClick={handleClickAdd}>{_('add')}</Button>
					<Button onClick={handleClose}>{_('cancel')}</Button>
				</DialogActions>
			</Dialog>
		</React.Fragment>
	);
};
