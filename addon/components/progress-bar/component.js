import Component from '@ember/component';
import { computed, get } from '@ember/object';
import layout from './template';

export default Component.extend({
  layout,

  color:  '',
  min:    0,
  value:  0,
  max:    100,

  didInsertElement() {
    this.percentDidChange();
    this.zIndexDidChange();
  },

  width: computed('percent', function() {
    return `${ get(this, 'percent') }%`.htmlSafe();
  }),

  percent: computed('min', 'max', 'value', function() {
    var min   = get(this, 'min');
    var max   = get(this, 'max');
    var value = Math.max(min, Math.min(max, get(this, 'value')));

    var per = value / (max - min) * 100; // Percent 0-100

    per = Math.round(per * 100) / 100; // Round to 2 decimal places

    return per;
  }),
});
