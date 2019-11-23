import { helper } from '@ember/component/helper';

export function isEmptyObject(params) {
    return Object.keys(params[0]).length === 0;
}

export default helper(isEmptyObject);
