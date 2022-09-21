// This file extends the AdapterConfig type from "@types/iobroker"

// Augment the globally declared type ioBroker.AdapterConfig
declare global {
	namespace ioBroker {
		interface AdapterConfig {
			synctime: number;
			resetValues: boolean;
			noLogs: boolean;
			apikey: string;
			station: Station[];
		}

		interface Station {
			station: string;
			stationname: string;
			discounted: boolean;
			discountObj: {
				discount: number;
				fuelType: string[];
				discountType: string;
			};
		}
	}
}

// this is required so the above AdapterConfig is found by TypeScript / type checking
export {};
