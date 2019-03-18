import { helper } from '@ember/component/helper';
import { ucFirst } from '@rancher/ember-shared/utils/string';

export function ucFirstHelper(params) {
  return ucFirst(params[0]);
}

export default helper(ucFirstHelper);
