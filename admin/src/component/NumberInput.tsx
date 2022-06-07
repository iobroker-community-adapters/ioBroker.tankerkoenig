import { FormControl, TextField, Tooltip } from '@mui/material';
import { useI18n } from 'iobroker-react/hooks';
import React, { useState } from 'react';

interface NumberInputProps {
	min: number;
	max: number;
	label: string;
	tooltip: string;
	defaultValue?: number;
	value: number;
	sx: any;
	onChange: (value: number) => void;
}

export const NumberInput: React.FC<NumberInputProps> = ({
	min,
	max,
	label,
	tooltip,
	defaultValue,
	value,
	sx,
	onChange,
}): JSX.Element => {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [values, setValues] = useState<number>(defaultValue ?? 80);
	const { translate: _ } = useI18n();

	return (
		<React.Fragment>
			<FormControl variant="outlined">
				<Tooltip title={_(`${tooltip}`)} arrow>
					<TextField
						variant="outlined"
						type="number"
						label={_(`${label}`)}
						value={value}
						color={'success'}
						sx={sx}
						onChange={(e) => {
							const value = e.target.value;
							if (value !== '') {
								let newValue = parseInt(e.target.value, 10);
								if (newValue > max) newValue = max;
								if (newValue < min) newValue = min;
								setValues(newValue);
								onChange(newValue);
							} else {
								const value = min;
								setValues(value);
								onChange(value);
							}
						}}
					/>
				</Tooltip>
			</FormControl>
		</React.Fragment>
	);
};
