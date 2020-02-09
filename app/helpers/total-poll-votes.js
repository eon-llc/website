import { helper } from '@ember/component/helper';

export function totalPollVotes(params) {
  const [ options, is_token_poll ] = params;
  let total = 0;

  for(let i=0; i<options.length; i++) {
    if(is_token_poll) {
      total += options[i].votes / 10000;
    } else {
      total += options[i].votes;
    }
  }

  return Math.floor(total);
}

export default helper(totalPollVotes);
