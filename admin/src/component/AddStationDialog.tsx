/**
 * Created by issi on 31.10.21
 */
import { FormControl, Grid, TextField, Tooltip } from '@mui/material';
import { useI18n } from 'iobroker-react/hooks';
import React, { useEffect, useState } from 'react';

export interface RowProps {
	addRow: (value: ioBroker.Station) => void;
}

const max = 36;
const pattern = /[0-9|a-z]{8}\-[0-9|a-z]{4}\-[0-9|a-z]{4}\-[0-9|a-z]{4}\-[0-9|a-z]{12}/g;

export const AddStationDialog: React.FC<RowProps> = ({ addRow }): JSX.Element => {
	const { translate: _ } = useI18n();
	const [stationID, setStationID] = useState<string>('');

	const [name, setName] = useState<string>('');
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [error, setError] = useState<boolean>(true);
	const [newRow, setNewRow] = useState({
		station: '',
		stationname: '',
	});
	const [valid, setValid] = useState(true);

	useEffect(() => {
		addRow(newRow);
	}, [newRow]);

	const handleValidate = (value: string) => {
		if (value.match(pattern)) {
			setValid(false);
		} else {
			setValid(true);
		}
	};
	const handleChangeName = (event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>): void => {
		const newName: string = event.target.value;
		if (newName !== '') {
			setName(newName);
			setNewRow({ ...newRow, stationname: newName });
		} else {
			setName('');
			setNewRow({ ...newRow, stationname: '' });
		}
	};

	const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
		const id = event.clipboardData.getData('text');
		if (id.length > max) {
			setStationID(id.substring(0, max));
			setNewRow({ ...newRow, station: id.substring(0, max) });
		} else {
			setStationID(id);
			setNewRow({ ...newRow, station: id });
		}
	};

	const handleChangeId = (event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>): void => {
		const newId: string = event.target.value;
		if (newId !== '') {
			setStationID(newId);
			setNewRow({ ...newRow, station: newId });
			setError(false);
		} else {
			setStationID('');
			setNewRow({ ...newRow, station: '' });
			setError(true);
		}
	};

	useEffect(() => {
		handleValidate(stationID);
	}, [stationID]);

	return (
		<React.Fragment>
			<Grid
				container
				spacing={3}
				sx={{
					marginTop: '20px',
					paddingBottom: '15px',
					alignItems: 'center',
					justifyContent: 'space-around',
					display: 'flex',
					flexWrap: 'nowrap',
					flexDirection: 'row',
				}}
			>
				<Tooltip title={_('tooltipStationName')} arrow placement={'top'}>
					<TextField
						required
						label={_('StationName')}
						value={name}
						type={'text'}
						sx={{
							width: '40ch',
						}}
						placeholder={_('shell_city')}
						inputProps={{
							maxLength: 20,
						}}
						onChange={(event) => {
							handleChangeName(event);
						}}
					/>
				</Tooltip>
			</Grid>
			<Grid
				container
				spacing={3}
				sx={{
					marginTop: '0',
					paddingBottom: '15px',
					alignItems: 'center',
					justifyContent: 'space-around',
					display: 'flex',
					flexWrap: 'nowrap',
					flexDirection: 'row',
				}}
			>
				<React.Fragment>
					<FormControl variant="outlined">
						<Tooltip title={_('tooltipStationID')} arrow>
							<TextField
								required
								variant="outlined"
								error={valid}
								color="success"
								label={_('station_id')}
								value={stationID}
								type="text"
								placeholder="ab345678-ab34-ab34-ab34-ab3456789012"
								sx={{ width: '47ch', margin: 1 }}
								helperText={!valid ? _('good') : _('wrong')}
								inputProps={{
									maxLength: 36,
								}}
								onPaste={handlePaste}
								onChange={handleChangeId}
							/>
						</Tooltip>
					</FormControl>
				</React.Fragment>
			</Grid>
		</React.Fragment>
	);
};
