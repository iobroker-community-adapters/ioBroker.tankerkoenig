export const statesObj: { [key: string]: any } = {
	status: {
		type: 'state',
		common: {
			name: 'Station Status',
			type: 'string',
			role: 'text',
			def: '',
			read: true,
			write: false,
		},
		native: {},
	},
	name: {
		type: 'state',
		common: {
			name: 'Station Name',
			type: 'string',
			role: 'text',
			def: '',
			read: true,
			write: false,
		},
		native: {},
	},
	station_id: {
		type: 'state',
		common: {
			name: 'Station ID',
			type: 'string',
			role: 'text',
			def: '',
			read: true,
			write: false,
		},
		native: {},
	},
	discounted: {
		type: 'state',
		common: {
			name: 'Discount active',
			desc: 'Shows whether the discount is activated at this station',
			type: `boolean`,
			role: `indicator`,
			def: false,
			read: true,
			write: false,
		},
		native: {},
	},
	discount: {
		type: 'state',
		common: {
			name: 'Discount',
			desc: 'Shows the discount at this station',
			type: `number`,
			role: `value`,
			def: 0,
			read: true,
			write: false,
		},
		native: {},
	},
};

export const priceObj: { [key: string]: any } = {
	'3rd': {
		type: 'state',
		common: {
			type: 'number',
			role: 'state',
			def: 0,
			read: true,
			write: false,
		},
		native: {},
	},
	combined: {
		type: 'state',
		common: {
			type: 'string',
			role: 'text',
			def: '',
			read: true,
			write: false,
		},
		native: {},
	},
	feed: {
		type: 'state',
		common: {
			type: 'number',
			role: 'state',
			def: 0,
			unit: '€',
			read: true,
			write: false,
		},
		native: {},
	},
	short: {
		type: 'state',
		common: {
			type: 'string',
			role: 'text',
			def: '',
			unit: '€',
			read: true,
			write: false,
		},
		native: {},
	},
};
