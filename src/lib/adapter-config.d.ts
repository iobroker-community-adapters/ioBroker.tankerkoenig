// This file extends the AdapterConfig type from "@types/iobroker"

// Augment the globally declared type ioBroker.AdapterConfig
declare global {
	namespace ioBroker {
		interface AdapterConfig {
			synctime: number;
			resetValues: boolean;
			apikey: string;
			station: Station[];
			combinedOptions: {
				closed: string;
				noPrice: string;
				notFound: string;
			};
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
			city: string;
			postCode: number;
			street: string;
			latitude?: number;
			longitude?: number;
			houseNumber: string;
			wholeDay?: boolean;
			openingTimes?: { [key: string]: string }[] | string;
			overrides?: { [key: string]: string }[] | string;
		}
	}
}

// this is required so the above AdapterConfig is found by TypeScript / type checking
export {};
