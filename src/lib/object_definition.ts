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
	street: {
		type: 'state',
		common: {
			name: 'Street',
			desc: 'Street of the station',
			type: 'string',
			role: 'text',
			def: '',
			read: true,
			write: false,
		},
		native: {},
	},
	fullStreet: {
		type: 'state',
		common: {
			name: 'Full Street',
			desc: 'Full street of the station',
			type: 'string',
			role: 'text',
			def: '',
			read: true,
			write: false,
		},
		native: {},
	},
	postCode: {
		type: 'state',
		common: {
			name: 'Post Code',
			desc: 'Post Code of the station',
			type: 'string',
			role: 'value',
			def: '',
			read: true,
			write: false,
		},
		native: {},
	},
	city: {
		type: 'state',
		common: {
			name: 'city',
			decr: 'City of the station',
			type: 'string',
			role: 'text',
			def: '',
			read: true,
			write: false,
		},
		native: {},
	},
	houseNumber: {
		type: 'state',
		common: {
			name: 'House Number',
			desc: 'House Number of the station',
			type: 'string',
			role: 'value',
			def: '',
			read: true,
			write: false,
		},
		native: {},
	},
	latitude: {
		type: 'state',
		common: {
			name: 'Latitude',
			desc: 'Latitude of the station',
			type: 'number',
			role: 'value.gps.latitude',
			unit: '°',
			def: 0,
			read: true,
			write: false,
		},
		native: {},
	},
	longitude: {
		type: 'state',
		common: {
			name: 'Longitude',
			desc: 'Longitude of the station',
			type: 'number',
			role: 'value.gps.longitude',
			unit: '°',
			def: 0,
			read: true,
			write: false,
		},
		native: {},
	},
	wholeDay: {
		type: 'state',
		common: {
			name: 'Whole Day',
			desc: 'Shows whether the station is open 24/7',
			type: 'boolean',
			role: 'indicator',
			def: false,
			read: true,
			write: false,
		},
		native: {},
	},
	openingTimes: {
		type: 'state',
		common: {
			name: 'Opening Times',
			desc: 'Opening Times of the station',
			type: 'string',
			role: 'json',
			def: 'no data',
			read: true,
			write: false,
		},
		native: {},
	},
	overrides: {
		type: 'state',
		common: {
			name: 'Opening Times Overrides',
			desc: 'Opening Times Overrides of the station',
			type: 'string',
			role: 'json',
			def: 'no data',
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
			desc: 'Price for 3rd party',
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
			desc: 'Combined Price as html',
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
			desc: 'Price for feed',
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
			desc: 'Short Price of the station',
			type: 'string',
			role: 'text',
			def: '',
			unit: '€',
			read: true,
			write: false,
		},
		native: {},
	},
	difference: {
		type: 'state',
		common: {
			desc: 'Difference between the last and the current price',
			type: 'number',
			role: 'value',
			def: 0,
			unit: '€',
			min: -100,
			max: 100,
			read: true,
			write: false,
		},
		native: {},
	},
	cheapest: {
		type: 'state',
		common: {
			desc: 'Shows whether the station is the cheapest',
			type: 'boolean',
			role: 'indicator',
			def: false,
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
