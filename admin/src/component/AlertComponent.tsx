/**
 * Created by alex-issi on 06.05.22
 */
import { Close } from '@mui/icons-material';
import { Alert, AlertTitle, Collapse, IconButton, SxProps, Theme } from '@mui/material';
import { useI18n } from 'iobroker-react/hooks';
import React, { useEffect, useState } from 'react';

export interface AlertComponentProps {
	collapse: {
		active: boolean;
		open: boolean;
		onClose?: () => void;
	};
	text: string;
	alertType: 'success' | 'warning' | 'error' | 'info';
	variant?: 'filled' | 'outlined' | 'standard';
	icon?: JSX.Element;
	alertTitle?: 'success' | 'warning' | 'error' | 'info';
	color?: 'success' | 'warning' | 'error' | 'info';
	sx?: SxProps<Theme>;
}
let collapseTimeout: NodeJS.Timeout;
export const AlertComponent: React.FC<AlertComponentProps> = ({
	collapse,
	text,
	alertType,
	variant,
	icon,
	alertTitle,
	color,
	sx,
}): JSX.Element => {
	const { translate: _ } = useI18n();
	const [open, setOpen] = useState(collapse.open);

	useEffect(() => {
		if (collapseTimeout) clearTimeout(collapseTimeout);
		if (open) {
			collapseTimeout = setTimeout(() => {
				collapse.onClose && collapse.onClose();
			}, 4000);
		} else {
			collapse.onClose && collapse.onClose();
		}
	}, [open]);

	return (
		<React.Fragment>
			{collapse.active ? (
				<Collapse
					in={collapse.open}
					sx={{
						display: 'flex',
						'.MuiCollapse-wrapperInner': {
							display: 'flex',
							justifyContent: 'center',
						},
					}}
				>
					<Alert
						variant={variant ? variant : 'filled'}
						severity={alertType}
						icon={icon}
						color={color}
						sx={sx}
						action={
							<IconButton
								color="inherit"
								size="small"
								onClick={() => {
									if (collapse.onClose) {
										setOpen((prevState) => !prevState);
									}
								}}
							>
								<Close fontSize="inherit" />
							</IconButton>
						}
					>
						{alertTitle ? <AlertTitle>{_(alertTitle)}</AlertTitle> : null}
						{_(text)}
					</Alert>
				</Collapse>
			) : (
				<Alert
					variant={variant ? variant : 'filled'}
					severity={alertType}
					icon={icon}
					color={color}
					sx={sx}
				>
					{alertTitle ? <AlertTitle>{_(alertTitle)}</AlertTitle> : null}
					{_(text)}
				</Alert>
			)}
		</React.Fragment>
	);
};
