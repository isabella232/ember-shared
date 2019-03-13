import { helper } from '@ember/component/helper';
import { formatSi } from 'shared/utils/unit';

export function format(params) {
  return formatSi(params[0], params);
}

export default helper(format);
