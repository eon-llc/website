import { helper } from '@ember/component/helper';
import moment from 'moment';

export function momentUtc(params) {
  const [ time ] = params;
  return moment.utc(time);
}

export default helper(momentUtc);
