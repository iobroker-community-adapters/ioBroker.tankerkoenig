import Logo from '@iobroker/adapter-react-v5/Components/Logo';
import { useGlobals, useIoBrokerObject } from 'iobroker-react/hooks';
import React from 'react';

export const DownloadUploadButton = (): JSX.Element => {
	const { instance, namespace } = useGlobals();
	const [myObject, setObject] = useIoBrokerObject(`system.adapter.${namespace}`, {
		subscribe: false,
	});

	const handleLoadConfig = (native: ioBroker.AdapterConfig) => {
		if (myObject)
			setObject({
				...myObject,
				native,
			});
	};

	return (
		<React.Fragment>
			<Logo
				common={myObject ? myObject.common : {}}
				native={myObject ? myObject.native : {}}
				instance={instance}
				style={{
					margin: '15px auto',
				}}
				onError={(str) => console.error(str)}
				onLoad={(native: ioBroker.AdapterConfig) => handleLoadConfig(native)}
				classes={{ buttons: '', logo: 'logo' }}
			/>
		</React.Fragment>
	);
};
