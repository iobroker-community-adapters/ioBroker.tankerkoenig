/**
 * Created by alex-issi on 05.06.22
 */
import { Typography } from '@mui/material';
import { useI18n } from 'iobroker-react/hooks';
import React from 'react';

export interface SpacerProps {
	variant?:
		| 'h1'
		| 'h2'
		| 'h3'
		| 'h4'
		| 'h5'
		| 'h6'
		| 'subtitle1'
		| 'subtitle2'
		| 'body1'
		| 'body2'
		| 'caption'
		| 'button';
	align?: 'inherit' | 'left' | 'center' | 'right' | 'justify';
	component?: React.ElementType;
	sx?: React.CSSProperties;
	text?: string;
	//props
}

export const Spacer: React.FC<SpacerProps> = ({ variant, align, component, sx, text }): JSX.Element => {
	const { translate: _ } = useI18n();

	return (
		<React.Fragment>
			<Typography
				component={component ? component : 'div'}
				variant={variant ? variant : 'h6'}
				gutterBottom
				align={align ? align : 'center'}
				sx={
					sx
						? sx
						: {
								marginTop: '20px',
								marginBottom: '20px',
								borderRadius: '5px',
								backgroundColor: 'divider',
						  }
				}
			>
				{_(`${text}`)}
			</Typography>
		</React.Fragment>
	);
};
