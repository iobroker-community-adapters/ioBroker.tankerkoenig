import axios from 'axios';
import { expect } from 'chai';

describe(`axios ${axios.VERSION} response test`, () => {
	it('should return a 200 response', async () => {
		const response = await axios.get('https://jsonplaceholder.typicode.com/posts/1');
		if (response.status === 200) {
			console.log('axios response code is 200 OK');
			expect(response.status).to.equal(200);
		} else {
			console.log('axios response code is not 200 failed');
			console.log('code: ', response.status);
			expect(response.status).to.equal(200);
		}
	});

	// check the response data is an object
	it('should return the correct data', async () => {
		const response = await axios.get('https://jsonplaceholder.typicode.com/posts/1');
		// console.log('response data: ', response.data);
		if (typeof response.data === 'object') {
			console.log('axios response data is an object');
			console.log('axios response data: ', response.data);
			expect(response.data).to.be.an('object');
		} else {
			console.log('axios response data is not an object failed');
			console.log('data: ', response.data);
			expect(response.data).to.be.an('object');
		}
	});
});
