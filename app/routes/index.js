import Route from '@ember/routing/route';
import RSVP from 'rsvp';

export default Route.extend({
	model() {
		let blogPromise = function() {
			return fetch('https://api.rss2json.com/v1/api.json?rss_url=https://medium.com/feed/eon-llc')
				.then((res) => res.json())
				.then((data) => {
					let latest = data.items[0];
					let months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
					let date = new Date(latest.pubDate);

					return {
						url: latest.link,
						title: latest.title,
						author: latest.author,
						date: months[date.getMonth()] + " " + date.getDay() + ", " + date.getFullYear(),
					}
				});
		};

		let githubPromise = function() {
			return fetch('https://api.eon.llc/v1/github')
			.then((data) => data.json())
			.then((resp) => {
				return JSON.parse(resp.body);
			})
			.catch(() => { return false; })
		};

		return new RSVP.hash({
			blog_post: blogPromise(),
			github_stats: githubPromise()
		});
	}
});
