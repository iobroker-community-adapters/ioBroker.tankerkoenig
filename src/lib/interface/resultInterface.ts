export interface Result {
	[key: string]: {
		status: 'open' | 'closed' | 'no prices' | 'no stations' | 'not found';
		e5?: boolean | number;
		e10?: boolean | number;
		diesel?: boolean | number;
		[key: string]: any;
	};
}
