import { Connection } from 'iobroker-react/socket-client';

export interface RequestDetailProps {
	alert: { status: string; message: string; open: boolean };
	loading: boolean;
	data?: {
		street: string;
		city: string;
		houseNumber: string;
		postCode: string;
		latitude: number;
		longitude: number;
		wholeDay: boolean;
		openingTimes: { [key: string]: string }[] | string;
		overrides: { [key: string]: string }[] | string;
	};
}

export const requestDetail = async (
	connection: Connection<Record<string, never>, Record<string, never>>,
	namespace: string,
	type: string,
	id: string,
): Promise<RequestDetailProps | void> => {
	try {
		const result = await connection.sendTo(namespace, type, id);
		if (!result) {
			console.error('No result');
			return {
				alert: { status: 'error', message: `No result for ${type} `, open: true },
				loading: false,
			};
		} else {
			if (result.ok) {
				return {
					alert: { status: result.status, message: '', open: false },
					loading: false,
					data: result.data,
				};
			} else if (result.code === 'ECONNABORTED') {
				console.error('Timeout', result.message);
				return {
					alert: { status: 'error', message: result.message, open: true },
					loading: false,
				};
			} else {
				console.error(result.message);
				return {
					alert: { status: result.status, message: result.message, open: true },
					loading: false,
				};
			}
		}
	} catch (error) {
		console.error(error);
	}
};
