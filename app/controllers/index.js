import Controller from '@ember/controller';
import ENV from 'website/config/environment';

export default Controller.extend({
    voteURL: ENV.APP.voteURL
});
