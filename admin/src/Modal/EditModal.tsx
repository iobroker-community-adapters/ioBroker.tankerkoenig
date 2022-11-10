import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid } from '@mui/material';
import { useI18n } from 'iobroker-react/hooks';
import React, { useState } from 'react';
import { EditTableDialog } from '../component/EditTableDialog';
import { StationFinder } from '../component/StationFinder';

export interface EditModalProps {
	newRow: (value: ioBroker.Station, index: number | null) => void;
	oldRow: ioBroker.Station | undefined;
	index: number | null;
	open: boolean;
	onClose: () => void;
}

export const EditModal: React.FC<EditModalProps> = ({
	newRow,
	index,
	open,
	oldRow,
	onClose,
}): JSX.Element => {
	const [row, setRow] = useState<ioBroker.Station>();

	const { translate: _ } = useI18n();

	const handleClickAdd = (row: ioBroker.Station | undefined): void => {
		//		console.log('row', row);
		if (row) {
			//			console.log('row', row);
			newRow(row, index);
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
					{_('editStation')}
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
						<EditTableDialog editRow={(value) => setRow(value)} oldRow={oldRow} />
						<StationFinder />
					</Grid>
				</DialogContent>

				<DialogActions>
					<Button onClick={() => handleClickAdd(row)}>{_('add')}</Button>
					<Button onClick={handleClose}>{_('cancel')}</Button>
				</DialogActions>
			</Dialog>
		</React.Fragment>
	);
};
