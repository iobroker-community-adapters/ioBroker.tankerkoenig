import { Box, Button, Grid, Tab, Tabs, Tooltip } from '@mui/material';
import { SettingsHeader } from 'iobroker-react';
import { useAdapter, useI18n } from 'iobroker-react/hooks';
import React, { useState } from 'react';
import { AdapterInterval } from './component/AdapterInterval';
import { AlertComponent } from './component/AlertComponent';
import { ApiKey } from './component/ApiKey';
import { PriceSettings } from './component/PriceSettings';
import { Spacer } from './component/Spacer';
import { StationCard } from './component/StationCard';
import { VisCombinedOptions } from './component/VisCombinedOptions';
import { AddModal } from './Modal/AddModal';
import { EditModal } from './Modal/EditModal';

interface SettingPageProps {
	secret: string;
	onChange: (key: keyof ioBroker.AdapterConfig, value: any) => void;
	settings: ioBroker.AdapterConfig;
}
interface TabPanelProps {
	children?: React.ReactNode;
	index: number;
	value: number;
}

function TabPanel(props: TabPanelProps) {
	const { children, value, index, ...other } = props;

	return (
		<div
			role="tabpanel"
			hidden={value !== index}
			id={`tankerkoenig-tabpanel-${index}`}
			aria-labelledby={`tankerkoenig-tab-${index}`}
			{...other}
		>
			{value === index && <Box sx={{ p: 4, mt: '115px' }}>{children}</Box>}
		</div>
	);
}

function a11yProps(index: number) {
	return {
		id: `tankerkoenig-tab-${index}`,
		'aria-controls': `tankerkoenig-tabpanel-${index}`,
	};
}

let newRow: any = [];

export const SettingPage: React.FC<SettingPageProps> = ({ onChange, settings, secret }): JSX.Element => {
	const { translate: _ } = useI18n();
	const { alive } = useAdapter();
	const [value, setValue] = React.useState(0);
	const [open, setOpen] = useState(false);
	const [alert, setAlert] = React.useState({
		message: '',
		active: false,
		open: false,
	});
	const [editModal, setEditModal] = useState<{
		open: boolean;
		index: number | null;
		oldRow?: ioBroker.Station;
		currentRows?: ioBroker.Station[];
	}>({
		open: false,
		index: null,
		oldRow: undefined,
		currentRows: [],
	});

	const handleChange = (event: React.SyntheticEvent, newValue: number) => {
		setValue(newValue);
	};

	const handleClickOpen = (): void => {
		if (settings.station.length <= 9) {
			setAlert({
				...alert,
				active: false,
				open: false,
			});
			setOpen(true);
		} else {
			setAlert({
				...alert,
				active: true,
				open: true,
			});
		}
	};
	//add row
	const handleAdd = async (value: ioBroker.Station): Promise<void> => {
		newRow = [...settings.station];
		newRow.push(value);
		onChange('station', newRow);
	};

	//edit row
	const handleEdit = (value: ioBroker.Station, index: number | null): void => {
		if (settings.station.length === 0) {
			settings.station = [];
		}
		const newRows = [...settings.station];
		if (index !== null) {
			newRows[index] = value;
		}
		onChange('station', newRows);
	};

	//delete row
	const handleDeleteRow = (name: string): void => {
		const newRows = settings.station.filter((row) => row.station !== name);
		newRow = [];
		onChange('station', newRows);
	};

	return (
		<React.Fragment>
			<Box
				sx={{
					width: '100%',
					position: 'fixed',
					zIndex: 999,
					marginTop: '0',
					paddingRight: '70px',
				}}
			>
				<Box
					sx={{
						borderBottom: 1,
						borderColor: 'divider',
						bgcolor: 'background.paper',
						marginTop: '-20px',
					}}
				>
					<Tabs
						value={value}
						indicatorColor="secondary"
						textColor="inherit"
						variant="fullWidth"
						scrollButtons="auto"
						allowScrollButtonsMobile
						onChange={handleChange}
					>
						<Tab label={_('settingsTab')} {...a11yProps(0)} />
						<Tab label={_('stationsTab')} {...a11yProps(1)} />
					</Tabs>
				</Box>
				<Box
					sx={{
						bgcolor: 'background.paper',
					}}
				>
					<SettingsHeader classes={{ logo: 'logo' }} />
				</Box>
			</Box>
			<TabPanel value={value} index={0}>
				<ApiKey secret={secret} settings={settings} onChange={(key, value) => onChange(key, value)} />
				<Spacer text={'spacerInterval'} />
				<AdapterInterval onChange={onChange} settings={settings} />
				<Spacer text={'combined_settings'} />
				<VisCombinedOptions onChange={onChange} settings={settings} />
				<Spacer text={'price_settings'} />
				<PriceSettings onChange={onChange} settings={settings} />
			</TabPanel>
			<TabPanel value={value} index={1}>
				<Grid
					container
					spacing={3}
					sx={{
						display: 'flex',
						flexDirection: 'column',
						justifyContent: 'space-around',
						alignItems: 'center',
						bgcolor: 'background.paper',
						position: 'fixed',
						marginTop: '-40px',
						marginLeft: '-33px',
						zIndex: 999,
						height: '60px',
						width: 'calc(100% + -70px)',
					}}
				>
					<EditModal
						alive={alive}
						newRow={(editRows, index) => handleEdit(editRows, index)}
						currentRows={editModal.currentRows}
						oldRow={editModal.oldRow}
						index={editModal.index}
						open={editModal.open}
						onClose={() => setEditModal({ index: null, open: false })}
					/>
					<Tooltip
						title={_('tooltipAddStation')}
						arrow
						placement={'top'}
						enterNextDelay={500}
						enterDelay={500}
					>
						<Button
							variant="contained"
							size="large"
							color={'primary'}
							onClick={handleClickOpen}
							sx={{
								margin: '20 auto',
							}}
						>
							{_('addStation')}
						</Button>
					</Tooltip>
				</Grid>
				<Grid
					container
					spacing={3}
					sx={{
						display: 'flex',
						flexDirection: 'column',
						justifyContent: 'space-around',
						alignItems: 'center',
						position: 'fixed',
						marginTop: '20px',
						marginLeft: '-33px',
						zIndex: 999,
						height: 'auto',
						width: 'calc(100% + -70px)',
					}}
				>
					{alert.open ? (
						<AlertComponent
							collapse={{
								active: true,
								open: true,
								onClose: () => setAlert({ ...alert, open: false }),
							}}
							text={'max10'}
							alertType={'warning'}
							alertTitle={'warning'}
						/>
					) : (
						<AddModal
							alive={alive}
							newRow={(value) => handleAdd(value)}
							currentRows={settings.station}
							open={open}
							onClose={() => setOpen(false)}
						/>
					)}
				</Grid>

				<Grid
					container
					spacing={2}
					sx={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}
				>
					{settings.station.map((row, index) => {
						return (
							<StationCard
								key={`${row.station}${index}`}
								item={row}
								index={index}
								currentRows={settings.station}
								editModal={(value) => setEditModal(value)}
								deleteModal={(name) => handleDeleteRow(name)}
							/>
						);
					})}
				</Grid>
			</TabPanel>
		</React.Fragment>
	);
};
