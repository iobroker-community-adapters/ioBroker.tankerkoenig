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

export const cheapestObj: { [key: string]: any } = {
	cheapest_stations: {
		type: 'state',
		common: {
			name: 'all Cheapest Stations',
			desc: 'all Cheapest Stations as Array',
			type: 'string',
			role: 'json',
			def: '',
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

export const priceMinMaxObj: { [key: string]: any } = {
	'3rd_min': {
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
	'3rd_max': {
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
	combined_min: {
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
	combined_max: {
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
	short_min: {
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
	short_max: {
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
	feed_min: {
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
	feed_max: {
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
	lastUpdate_min: {
		type: 'state',
		common: {
			type: `number`,
			role: `value.time`,
			def: 0,
			read: true,
			write: false,
		},
		native: {},
	},
	lastUpdate_max: {
		type: 'state',
		common: {
			type: `number`,
			role: `value.time`,
			def: 0,
			read: true,
			write: false,
		},
		native: {},
	},
};
