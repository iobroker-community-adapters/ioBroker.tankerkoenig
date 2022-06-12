/**
 * Created by issi on 31.10.21
 */
import {
	Box,
	Checkbox,
	FormControl,
	Grid,
	InputAdornment,
	InputLabel,
	ListItemText,
	MenuItem,
	OutlinedInput,
	Select,
	SelectChangeEvent,
	TextField,
	Tooltip,
	Typography,
} from '@mui/material';
import { useI18n } from 'iobroker-react/hooks';
import React, { useEffect, useState } from 'react';

export interface RowProps {
	addRow: (value: ioBroker.Station) => void;
}

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
	PaperProps: {
		style: {
			maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
			width: 250,
		},
	},
};

const fuelTypes = ['e5', 'e10', 'diesel'];

const max = 36;
const pattern = /[0-9|a-z]{8}\-[0-9|a-z]{4}\-[0-9|a-z]{4}\-[0-9|a-z]{4}\-[0-9|a-z]{12}/g;

export const AddStationDialog: React.FC<RowProps> = ({ addRow }): JSX.Element => {
	const { translate: _ } = useI18n();
	const [stationID, setStationID] = useState<string>('');
	const [discountType, setDiscountType] = useState<string>('absolute');
	const [discount, setDiscount] = useState<string>('0.00');
	const [fuelType, setFuelType] = useState<string[]>(['e5', 'e10', 'diesel']);
	const [discounted, setDiscounted] = useState<boolean>(false);

	const [name, setName] = useState<string>('');
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [error, setError] = useState<boolean>(true);
	const [newRow, setNewRow] = useState<ioBroker.Station>({
		station: '',
		stationname: '',
		discounted: false,
		discountObj: {
			discount: 0,
			fuelType: ['e5', 'e10', 'diesel'],
			discountType: 'absolute',
		},
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

	const handleChangeFuelType = (event: SelectChangeEvent<typeof fuelTypes>) => {
		const {
			target: { value },
		} = event;
		setFuelType(
			// On autofill we get a stringified value.
			typeof value === 'string' ? value.split(',') : value,
		);
		setNewRow({
			...newRow,
			discountObj: {
				...newRow.discountObj,
				fuelType: typeof value === 'string' ? value.split(',') : value,
			},
		});
	};
	const handleChangeDiscountType = (event: SelectChangeEvent) => {
		const {
			target: { value },
		} = event;
		setDiscountType(value);
		setDiscount('0');
		setNewRow({
			...newRow,
			discountObj: {
				...newRow.discountObj,
				discountType: value,
			},
		});
	};
	const handleChangeActivate = (event: SelectChangeEvent) => {
		const {
			target: { value },
		} = event;
		setDiscounted(JSON.parse(value));
		setNewRow({
			...newRow,
			discounted: JSON.parse(value),
			discountObj: {
				...newRow.discountObj,
				discount: parseFloat(parseFloat('0.00').toFixed(2)),
			},
		});
	};
	const handleChangeDiscount = (event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>): void => {
		if (discountType === 'absolute') {
			setDiscount(parseFloat(event.target.value).toFixed(2));
			setNewRow({
				...newRow,
				discountObj: {
					...newRow.discountObj,
					discount: parseFloat(parseFloat(event.target.value).toFixed(2)),
				},
			});
		} else {
			if (parseFloat(event.target.value) > 100) {
				setDiscount(parseFloat('100').toFixed(0));
				setNewRow({
					...newRow,
					discountObj: {
						...newRow.discountObj,
						discount: parseFloat(parseFloat('100').toFixed(0)),
					},
				});
			} else {
				setDiscount(parseFloat(event.target.value).toFixed(0));
				setNewRow({
					...newRow,
					discountObj: {
						...newRow.discountObj,
						discount: parseFloat(parseFloat(event.target.value).toFixed(0)),
					},
				});
			}
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

			<Grid
				container
				spacing={3}
				sx={{
					flexDirection: 'column',
					justifyContent: 'center',
					alignItems: 'center',
				}}
			>
				<Typography variant="h6" gutterBottom align="center">
					{_('discountOptions')}
				</Typography>
				<Box sx={{ minWidth: 150 }}>
					<FormControl sx={{ m: 1, minWidth: 150 }}>
						<InputLabel id="Activate-select-label">{_('enabledRabat')}</InputLabel>
						<Select
							labelId="Activate-select-label"
							id="Activate-select"
							autoWidth
							value={discounted.toString()}
							label={_('enabledRabat')}
							onChange={handleChangeActivate}
						>
							<MenuItem value={'true'}>{_('activate')}</MenuItem>
							<MenuItem value={'false'}>{_('deactivate')}</MenuItem>
						</Select>
					</FormControl>
					{discounted ? (
						<React.Fragment>
							<FormControl sx={{ m: 1, minWidth: 150 }}>
								<InputLabel id="fuelType-multiple-checkbox-label">{_('fuelType')}</InputLabel>
								<Select
									labelId="fuelType-multiple-checkbox-label"
									id="fuelType-multiple-checkbox"
									multiple
									value={fuelType}
									onChange={handleChangeFuelType}
									input={<OutlinedInput label="{_('fuelType')}" />}
									sx={{ alignItems: 'center', justifyContent: 'center' }}
									renderValue={(selected) => selected.join(', ')}
									MenuProps={MenuProps}
								>
									{fuelTypes.map((name) => (
										<MenuItem key={name} value={name}>
											<Checkbox checked={fuelType.indexOf(name) > -1} />
											<ListItemText primary={name} />
										</MenuItem>
									))}
								</Select>
							</FormControl>
							<FormControl sx={{ m: 1, minWidth: 110 }}>
								<InputLabel id="discountType-select-label">{_('discountType')}</InputLabel>
								<Select
									labelId="discountType-select-label"
									id="discountType-select"
									value={discountType}
									label={_('discountType')}
									onChange={handleChangeDiscountType}
								>
									<MenuItem value={'absolute'}>{_('euro')}</MenuItem>
									<MenuItem value={'percent'}>{_('percent')}</MenuItem>
								</Select>
							</FormControl>
							<Box sx={{ m: 1, display: 'flex', justifyContent: 'center' }}>
								{discountType === 'absolute' ? (
									<FormControl sx={{ m: 1, minWidth: 110, maxWidth: 110 }}>
										<TextField
											required
											type="number"
											label={_('discount')}
											value={discount}
											InputProps={{
												endAdornment: (
													<InputAdornment position="end">€</InputAdornment>
												),
											}}
											inputProps={{
												step: '0.01',
												min: '0.00',
											}}
											onChange={handleChangeDiscount}
										/>
									</FormControl>
								) : (
									<FormControl sx={{ m: 1, minWidth: 110, maxWidth: 110 }}>
										<TextField
											required
											type="number"
											label={_('discount')}
											value={discount}
											InputProps={{
												endAdornment: (
													<InputAdornment position="end">%</InputAdornment>
												),
											}}
											inputProps={{
												step: '1',
												min: '0',
												max: '100',
											}}
											onChange={handleChangeDiscount}
										/>
									</FormControl>
								)}
							</Box>
						</React.Fragment>
					) : null}
				</Box>
			</Grid>
		</React.Fragment>
	);
};
