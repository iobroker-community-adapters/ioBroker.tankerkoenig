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
import React, { useState } from 'react';
import { EditTableDialog } from '../component/EditTableDialog';
import { StationFinder } from '../component/StationFinder';

export interface EditModalProps {
	alive: boolean;
	newRow: (value: ioBroker.Station, index: number | null) => void;
	oldRow: ioBroker.Station | undefined;
	index: number | null;
	open: boolean;
	onClose: () => void;
}

export const EditModal: React.FC<EditModalProps> = ({
	alive,
	newRow,
	index,
	open,
	oldRow,
	onClose,
}): JSX.Element => {
	const [row, setRow] = useState<ioBroker.Station>();

	const { translate: _ } = useI18n();

	const handleClickAdd = (row: ioBroker.Station | undefined): void => {
		if (row) {
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
					{_('editStation')}
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
							<EditTableDialog editRow={(value) => setRow(value)} oldRow={oldRow} />
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
							{_('adapterOffline')}
						</Alert>
					</DialogContent>
				)}

				<DialogActions>
					<Button disabled={!alive} onClick={() => handleClickAdd(row)}>
						{_('add')}
					</Button>
					<Button onClick={handleClose}>{_('cancel')}</Button>
				</DialogActions>
			</Dialog>
		</React.Fragment>
	);
};
