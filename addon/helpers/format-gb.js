import { helper } from '@ember/component/helper';
import { formatGb } from 'shared/utils/unit';

export function format(params) {
  return formatGb(params[0]);
}

export default helper(format);
