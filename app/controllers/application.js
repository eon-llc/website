import { equal } from '@ember/object/computed';
import Controller from '@ember/controller';

export default Controller.extend({
  isIndex: equal('currentRouteName', 'index')

});
