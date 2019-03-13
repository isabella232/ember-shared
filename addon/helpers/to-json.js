import { helper } from '@ember/component/helper';
import { htmlSafe } from '@ember/string';

export function toJson(params) {
  const str = JSON.stringify(params[0], null, 2) || 'null';

  return new htmlSafe(`<pre><code>${ str.replace(/\n/g, '<br/>\n') }</code></pre>`);
}

export default helper(toJson);
