import { helper } from '@ember/component/helper';
import { formatBytes } from 'shared/utils/unit';

export function format(params) {
  return formatBytes(params[0]);
}

export default helper(format);
