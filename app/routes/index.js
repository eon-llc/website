import Route from '@ember/routing/route';
import RSVP from 'rsvp';
import axios from 'axios';

export default Route.extend({
	model() {

		let blogPromise = async () => {
			return await axios({
					method: 'get',
					url: 'https://api.eon.llc/v1/blog',
					timeout: 3000
				})
				.then((response) => {
					return JSON.parse(response.data.body);
				})
				.catch(() => { return false; });
		};

		let githubPromise = async () => {
			return await axios({
					method: 'get',
					url: 'https://api.eon.llc/v1/github',
					timeout: 3000
				})
			.then((response) => {
				return JSON.parse(response.data.body);
			})
			.catch(() => { return false; });
		};

		let apiPromise = async () => {
			return await axios({
					method: 'get',
					url: 'https://rem.eon.llc/v2/health',
					timeout: 1500
				})
				.then((response) => {
					let required = 4;
					let { health } = response.data;
					let healthy = 0;

					for(let service in health) {
						healthy += health[service].status === "OK" ? 1 : 0
					}

					if(healthy == required) {
						return "online"
					} else if(healthy > 0) {
						return "impaired"
					} else {
						return "offline"
					}
				})
				.catch(() => { return "offline"; });
		};

		return new RSVP.hash({
			blog_stats: blogPromise(),
			github_stats: githubPromise(),
			api_status: apiPromise()
		});
	}
});
