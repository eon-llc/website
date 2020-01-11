import Component from '@ember/component';
import ENV from 'website/config/environment';

export default Component.extend({

    tagName: '',
    vote_url: ENV.APP.voteURL,

});
