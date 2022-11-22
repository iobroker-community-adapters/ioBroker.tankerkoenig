import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, TextField } from '@mui/material';
import { useI18n } from 'iobroker-react/hooks';
import React, { useState } from 'react';

export interface VisCombinedOptionsModalProps {
	onChange: (
		key: keyof ioBroker.AdapterConfig,
		value: { closed: string; notFound: string; noPrice: string },
	) => void;
	native: ioBroker.AdapterConfig;
	open: boolean;
	onClose: () => void;
}
// let resetTimeout: NodeJS.Timeout;
export const VisCombinedOptionsModal: React.FC<VisCombinedOptionsModalProps> = ({
	onChange,
	open,
	onClose,
	native,
}): JSX.Element => {
	const { translate: t } = useI18n();
	const [closed, setClosed] = useState(native.combinedOptions.closed || 'Station Closed');
	const [noPrice, setNoPrice] = useState(native.combinedOptions.noPrice || 'No Prices');
	const [notFound, setNotFound] = useState(native.combinedOptions.notFound || 'Station Not Found');
	const [error, setError] = useState({
		messageClosed: t('good'),
		messageNoPrice: t('good'),
		messageNotFound: t('good'),
		errorClosed: false,
		errorNoPrice: false,
		errorNotFound: false,
	});
	const [valid, setValid] = useState(true);

	const handleChangeClosed = (event: React.ChangeEvent<HTMLInputElement>) => {
		const value = event.target.value;
		// check if the field is empty
		if (value.length === 0) {
			setError({
				...error,
				messageClosed: t('notBeEmpty'),
				errorClosed: true,
			});
			setValid(false);
		} else {
			setError({
				...error,
				messageClosed: t('good'),
				errorClosed: false,
			});
			setValid(true);
		}

		setClosed(event.target.value);
	};

	const handleChangeNoPrice = (event: React.ChangeEvent<HTMLInputElement>) => {
		const value = event.target.value;
		// check if the field is empty
		if (value.length === 0) {
			setError({
				...error,
				messageNoPrice: t('notBeEmpty'),
				errorNoPrice: true,
			});
			setValid(false);
		} else {
			setError({
				...error,
				messageNoPrice: t('good'),
				errorNoPrice: false,
			});
			setValid(true);
		}

		setNoPrice(event.target.value);
	};

	const handleChangeNotFound = (event: React.ChangeEvent<HTMLInputElement>) => {
		const value = event.target.value;
		// check if the field is empty
		if (value.length === 0) {
			setError({
				...error,
				messageNotFound: t('notBeEmpty'),
				errorNotFound: true,
			});
			setValid(false);
		} else {
			setError({
				...error,
				messageNotFound: t('good'),
				errorNotFound: false,
			});
			setValid(true);
		}

		setNotFound(event.target.value);
	};

	const handleClickAdd = (): void => {
		onChange('combinedOptions', { closed, noPrice, notFound });
		onClose();
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
					{t('combined_settings')}
				</DialogTitle>
				<DialogContent
					sx={{
						display: 'flex',
						flexWrap: 'nowrap',
						flexDirection: 'column',
						justifyContent: 'center',
						height: '350px',
						alignItems: 'center',
					}}
				>
					<TextField
						error={error.errorClosed}
						helperText={error.messageClosed}
						label={t('stationClosed')}
						color={!error.errorClosed ? 'success' : 'error'}
						value={closed}
						onChange={handleChangeClosed}
						sx={{
							width: '300px',
							marginRight: '10px',
							marginBottom: '15px',
						}}
						FormHelperTextProps={{
							sx: {
								color: error.errorClosed ? 'error.main' : 'success.main',
							},
						}}
						InputProps={{
							inputProps: {
								style: {
									textAlign: 'center',
								},
							},
						}}
					/>
					<TextField
						error={error.errorNoPrice}
						helperText={error.messageNoPrice}
						label={t('noPrices')}
						color={!error.errorNoPrice ? 'success' : 'error'}
						value={noPrice}
						onChange={handleChangeNoPrice}
						sx={{
							width: '300px',
							marginRight: '10px',
							marginBottom: '15px',
						}}
						FormHelperTextProps={{
							sx: {
								color: error.errorNoPrice ? 'error.main' : 'success.main',
							},
						}}
						InputProps={{
							inputProps: {
								style: {
									textAlign: 'center',
								},
							},
						}}
					/>
					<TextField
						error={error.errorNotFound}
						helperText={error.messageNotFound}
						label={t('notFound')}
						color={!error.errorNotFound ? 'success' : 'error'}
						value={notFound}
						onChange={handleChangeNotFound}
						sx={{
							width: '300px',
							marginRight: '10px',
							marginBottom: '15px',
						}}
						FormHelperTextProps={{
							sx: {
								color: error.errorNotFound ? 'error.main' : 'success.main',
							},
						}}
						InputProps={{
							inputProps: {
								style: {
									textAlign: 'center',
								},
							},
						}}
					/>
				</DialogContent>
				<DialogActions>
					<Button disabled={!valid} onClick={handleClickAdd} color="primary">
						{t('update')}
					</Button>
					<Button onClick={handleClose}>{t('cancel')}</Button>
				</DialogActions>
			</Dialog>
		</React.Fragment>
	);
};
