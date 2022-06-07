/**
 * Created by issi on 31.10.21
 */
import { FormControl, Grid, TextField, Tooltip } from '@mui/material';
import { useI18n } from 'iobroker-react/hooks';
import React, { useEffect, useState } from 'react';

export interface RowProps {
	editRow: (value: ioBroker.Station) => void;
	oldRow: ioBroker.Station | undefined;
}

const max = 36;
const pattern = /[0-9|a-z]{8}\-[0-9|a-z]{4}\-[0-9|a-z]{4}\-[0-9|a-z]{4}\-[0-9|a-z]{12}/g;

export const EditTableDialog: React.FC<RowProps> = ({ editRow, oldRow }): JSX.Element => {
	if (!oldRow) {
		oldRow = oldRow || {
			station: '',
			stationname: '',
		};
	}
	const { translate: _ } = useI18n();
	const [stationID, setStationID] = useState<string>(oldRow.station);
	const [name, setName] = useState<string>(oldRow.stationname);
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [error, setError] = useState<boolean>(true);
	const [valid, setValid] = useState(true);
	const [newEditRow, setEditRow] = useState<ioBroker.Station>(oldRow);

	useEffect(() => {
		// check if a change was made to the newRow
		if (oldRow) {
			if (stationID !== oldRow.station || name !== oldRow.stationname) {
				editRow(newEditRow);
			}
		}
	}, [newEditRow]);

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
			setEditRow({ ...newEditRow, stationname: newName });
		} else {
			setName('');
			setEditRow({ ...newEditRow, stationname: '' });
		}
	};

	const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
		const id = event.clipboardData.getData('text');
		if (id.length > max) {
			setStationID(id.substring(0, max));
			setEditRow({ ...newEditRow, station: id.substring(0, max) });
		} else {
			setStationID(id);
			setEditRow({ ...newEditRow, station: id });
		}
	};

	const handleChangeId = (event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>): void => {
		const newId: string = event.target.value;
		if (newId !== '') {
			setStationID(newId);
			setEditRow({ ...newEditRow, station: newId });
			setError(false);
		} else {
			setStationID('');
			setEditRow({ ...newEditRow, station: '' });
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
