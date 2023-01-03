/**
 * Created by issi on 31.10.21
 */
import {
	Alert,
	AlertTitle,
	Box,
	Checkbox,
	FormControl,
	Grid,
	IconButton,
	InputAdornment,
	InputLabel,
	LinearProgress,
	ListItemText,
	MenuItem,
	OutlinedInput,
	Select,
	SelectChangeEvent,
	TextField,
	Tooltip,
	Typography,
} from '@mui/material';
import { useConnection, useGlobals, useI18n } from 'iobroker-react/hooks';
import React, { useEffect, useState } from 'react';
import ContentPasteGoIcon from '@mui/icons-material/ContentPasteGo';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { NumberInput } from 'iobroker-react/components';
import { requestDetail, RequestDetailProps } from '../lib/DetailRequest';

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
let timeout: NodeJS.Timeout;
let loadingTimer: NodeJS.Timeout;
let alertTimeout: NodeJS.Timeout;
export const AddStationDialog: React.FC<RowProps> = ({ addRow }): JSX.Element => {
	const { translate: _ } = useI18n();
	const { namespace } = useGlobals();
	const connection = useConnection();
	const [alert, setAlert] = React.useState({
		message: '',
		open: false,
	});
	const [loading, setLoading] = React.useState(false);
	const [stationID, setStationID] = useState<string>('');
	const [discountType, setDiscountType] = useState<string>('absolute');
	const [discount, setDiscount] = useState<number>(0);
	const [fuelType, setFuelType] = useState<string[]>(['e5', 'e10', 'diesel']);
	const [discounted, setDiscounted] = useState<boolean>(false);
	const [name, setName] = useState<string>('');
	const [error, setError] = useState<boolean>(true);
	const [newRow, setNewRow] = useState<ioBroker.Station>({
		station: '',
		stationname: '',
		street: '',
		city: '',
		postCode: '',
		houseNumber: '',
		discounted: false,
		discountObj: {
			discount: 0,
			fuelType: ['e5', 'e10', 'diesel'],
			discountType: 'absolute',
		},
	});
	const [copyValid, setCopyValid] = useState(false);
	const [street, setStreet] = useState<string>('');
	const [city, setCity] = useState<string>('');
	const [postCode, setPostCode] = useState<string>('');
	const [houseNumber, setHouseNumber] = useState<string>('');

	useEffect(() => {
		addRow(newRow);
	}, [newRow]);

	const handleDetailRequest = async (
		id: string,
		typ: string,
	): Promise<RequestDetailProps['data'] | undefined> => {
		const detailResult = await requestDetail(connection, namespace, typ, id);
		if (detailResult) {
			if (detailResult.alert.status === 'error') {
				setAlert({
					message: detailResult.alert.message,
					open: true,
				});
				setLoading(detailResult.loading);
				return undefined;
			} else {
				setAlert({
					message: '',
					open: false,
				});
				setLoading(detailResult.loading);
				return detailResult.data;
			}
		} else {
			return undefined;
		}
	};

	const handleValidate = async (id: string) => {
		if (id.match(pattern)) {
			setError(false);
			const result = await handleDetailRequest(id, 'detailRequest');
			if (result) {
				setNewRow({
					...newRow,
					station: id,
					...result,
				});
				setCity(result.city);
				setHouseNumber(result.houseNumber);

				if (result.postCode) {
					result.postCode = result.postCode.toString();
					if (result.postCode !== '') {
						// check if the zip code has 5 digits
						if (result.postCode.length === 5) {
							setPostCode(result.postCode);
						} else {
							// setze der postleitzahl eine 0 voran
							setPostCode('0' + result.postCode);
						}
					} else {
						setPostCode('');
					}
				} else {
					setPostCode('');
				}

				setStreet(result.street);
			}
		} else {
			setError(true);
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

	const handleChangeCity = (event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>): void => {
		const newCity: string = event.target.value;
		if (newCity !== '') {
			setCity(newCity);
			setNewRow({ ...newRow, city: newCity });
		} else {
			setCity('');
			setNewRow({ ...newRow, city: '' });
		}
	};

	const handleChangePostCode = (event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>): void => {
		const newPostCode: string = event.target.value;
		if (newPostCode !== '') {
			// check if the input consists of numbers only
			if (newPostCode.match(/^[0-9]+$/)) {
				setPostCode(newPostCode);
				setNewRow({ ...newRow, postCode: newPostCode });
			}
		} else {
			setPostCode('');
			setNewRow({ ...newRow, postCode: '' });
		}
	};

	const handleChangeStreet = (event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>): void => {
		const newStreet: string = event.target.value;
		if (newStreet !== '') {
			setStreet(newStreet);
			setNewRow({ ...newRow, street: newStreet });
		} else {
			setStreet('');
			setNewRow({ ...newRow, street: '' });
		}
	};

	const handleChangeHouseNumber = (
		event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>,
	): void => {
		const newHouseNumber: string = event.target.value;
		if (newHouseNumber !== '') {
			setHouseNumber(newHouseNumber);
			setNewRow({ ...newRow, houseNumber: newHouseNumber });
		} else {
			setHouseNumber('');
			setNewRow({ ...newRow, houseNumber: '' });
		}
	};

	const handleChangeId = (event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>): void => {
		const newId: string = event.target.value;
		if (newId !== '') {
			setStationID(newId);
			setNewRow({ ...newRow, station: newId });
		} else {
			setStationID('');
			setNewRow({ ...newRow, station: '' });
		}
	};

	const handleChangeFuelType = (event: SelectChangeEvent<typeof fuelTypes>) => {
		const {
			target: { value },
		} = event;
		setFuelType(
			// On autofill, we get a stringified value.
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
		setDiscount(0);
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
				discount: 0,
			},
		});
	};

	const handleChangeDiscount = (value: number): void => {
		if (discountType === 'absolute') {
			setDiscount(value);
			setNewRow({
				...newRow,
				discountObj: {
					...newRow.discountObj,
					discount: value,
				},
			});
		} else {
			if (value > 100) {
				setDiscount(100);
				setNewRow({
					...newRow,
					discountObj: {
						...newRow.discountObj,
						discount: 100,
					},
				});
			} else {
				setDiscount(value);
				setNewRow({
					...newRow,
					discountObj: {
						...newRow.discountObj,
						discount: value,
					},
				});
			}
		}
	};

	useEffect(() => {
		if (loading) {
			console.log('loading');
			if (loadingTimer) clearTimeout(loadingTimer);
			loadingTimer = setTimeout(() => {
				setLoading(false);
				console.log('loading done');
			}, 5000);
		} else {
			console.log('not loading');
			if (loadingTimer) clearTimeout(loadingTimer);
		}
	}, [loading]);

	useEffect(() => {
		handleValidate(stationID);
	}, [stationID]);

	const handlePaste = () => {
		navigator.clipboard.readText().then((stationData) => {
			try {
				const json = JSON.parse(stationData);
				for (const jsonKey in json) {
					if (json.hasOwnProperty(jsonKey)) {
						const element = json[jsonKey];
						if (element.id) {
							setAlert({
								open: false,
								message: '',
							});
							setStationID(element.id);
							setLoading(true);
							setNewRow({
								...newRow,
								station: element.id,
							});
							setCopyValid(true);
						}
					}
				}
			} catch (e) {
				if (stationData.length > max) {
					setStationID(stationData.substring(0, max));
					setNewRow({ ...newRow, station: stationData.substring(0, max) });
				} else {
					setStationID(stationData);
					setNewRow({ ...newRow, station: stationData });
				}
			}
		});
	};

	// reset copyValid
	useEffect(() => {
		if (copyValid) {
			if (timeout) clearTimeout(timeout);
			timeout = setTimeout(() => {
				setCopyValid(false);
			}, 3000);
		} else {
			return;
		}
	}, [copyValid]);

	useEffect(() => {
		//reset alert in 3 seconds
		if (alert.open) {
			if (alertTimeout) clearTimeout(alertTimeout);
			alertTimeout = setTimeout(() => {
				setAlert({
					open: false,
					message: '',
				});
			}, 5000);
		}
	}, [alert]);

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
					flexWrap: 'wrap',
					flexDirection: 'column',
					marginLeft: '10px',
				}}
			>
				<React.Fragment>
					<Tooltip
						title={_('tooltipStationName')}
						arrow
						placement={'top'}
						enterNextDelay={500}
						enterDelay={500}
					>
						<TextField
							required
							label={_('StationName')}
							value={name}
							error={name.length <= 0}
							color="success"
							type={'text'}
							margin={'normal'}
							sx={{
								width: '40ch',
							}}
							placeholder={_('stationNamePlaceholder')}
							inputProps={{
								maxLength: 20,
								style: {
									textAlign: 'center',
								},
							}}
							onChange={(event) => {
								handleChangeName(event);
							}}
						/>
					</Tooltip>
					<FormControl variant="outlined">
						<Tooltip title={_('tooltipStationID')} arrow enterNextDelay={500} enterDelay={500}>
							<TextField
								required
								variant="outlined"
								error={error}
								color="success"
								label={_('station_id')}
								value={stationID}
								type="text"
								placeholder="ab345678-ab34-ab34-ab34-ab3456789012"
								sx={{ width: '47ch', margin: 1 }}
								helperText={!error ? _('good') : _('wrong')}
								inputProps={{
									maxLength: 36,
									style: { textAlign: 'center' },
								}}
								InputProps={{
									endAdornment: (
										<InputAdornment position="end">
											<IconButton onClick={handlePaste} edge="end">
												{copyValid ? (
													<CheckCircleOutlineIcon color="success" />
												) : (
													<ContentPasteGoIcon />
												)}
											</IconButton>
										</InputAdornment>
									),
								}}
								onPaste={handlePaste}
								onChange={handleChangeId}
							/>
						</Tooltip>
					</FormControl>
					{loading ? (
						<Box sx={{ width: '80%', height: '10px' }}>
							<LinearProgress />
						</Box>
					) : null}
					{alert.open ? (
						<Alert severity="warning">
							<AlertTitle>Warning</AlertTitle>
							{alert.message}
						</Alert>
					) : null}
					<Typography variant="h6" component="div" textAlign={'center'}>
						{_('stationLocation')}
					</Typography>
					<Box
						sx={{
							display: 'flex',
							alignItems: 'center',
							flexWrap: 'wrap',
							justifyContent: 'center',
							marginBottom: '20px',
						}}
					>
						<React.Fragment>
							<Tooltip
								title={_('tooltipStationStreet')}
								arrow
								placement={'top'}
								enterNextDelay={500}
								enterDelay={500}
							>
								<TextField
									label={_('stationStreet')}
									value={street}
									type={'text'}
									margin={'normal'}
									sx={{
										width: '25ch',
										marginRight: '10px',
									}}
									inputProps={{
										style: { textAlign: 'center' },
									}}
									placeholder={'Zedernweg 93'}
									onChange={(event) => {
										handleChangeStreet(event);
									}}
								/>
							</Tooltip>
							<Tooltip
								title={_('tooltipStationHouseNumber')}
								arrow
								placement={'top'}
								enterNextDelay={500}
								enterDelay={500}
							>
								<TextField
									label={_('houseNumber')}
									value={houseNumber}
									type={'text'}
									margin={'normal'}
									sx={{
										width: '15ch',
										marginRight: '10px',
									}}
									inputProps={{
										style: { textAlign: 'center' },
									}}
									placeholder={'7'}
									onChange={(event) => {
										handleChangeHouseNumber(event);
									}}
								/>
							</Tooltip>
							<Tooltip
								title={_('tooltipStationCity')}
								arrow
								placement={'top'}
								enterNextDelay={500}
								enterDelay={500}
							>
								<TextField
									label={_('stationCity')}
									value={city}
									type={'text'}
									margin={'normal'}
									sx={{
										width: '25ch',
										marginRight: '10px',
									}}
									inputProps={{
										style: { textAlign: 'center' },
									}}
									placeholder={'Wünnenberg'}
									onChange={(event) => {
										handleChangeCity(event);
									}}
								/>
							</Tooltip>
							<Tooltip
								title={_('tooltipStationZip')}
								arrow
								placement={'top'}
								enterNextDelay={500}
								enterDelay={500}
							>
								<TextField
									label={_('stationZip')}
									value={postCode.toString()}
									type={'text'}
									margin={'normal'}
									sx={{
										width: '15ch',
									}}
									placeholder={'10910'}
									inputProps={{
										maxLength: 5,
										style: { textAlign: 'center' },
									}}
									onChange={(event) => {
										handleChangePostCode(event);
									}}
								/>
							</Tooltip>
						</React.Fragment>
					</Box>
				</React.Fragment>
			</Grid>
			<Grid
				container
				spacing={3}
				sx={{
					flexDirection: 'column',
					justifyContent: 'center',
					alignItems: 'center',
					marginLeft: '10px',
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
										<NumberInput
											label={_('discount')}
											required={true}
											unit={'€'}
											min={0.0}
											step={0.01}
											value={discount}
											onChange={handleChangeDiscount}
										/>
									</FormControl>
								) : (
									<FormControl sx={{ m: 1, minWidth: 110, maxWidth: 110 }}>
										<NumberInput
											label={_('discount')}
											required={true}
											unit={'%'}
											min={0}
											max={100.0}
											step={1}
											value={discount}
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
