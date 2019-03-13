import { defineProperty, computed, get } from '@ember/object';
import { inject as service } from '@ember/service';
import Component from '@ember/component';
import layout from './template';

function toPercent(value, min, max) {
  value = Math.max(min, Math.min(max, value));
  var per = value / (max - min) * 100; // Percent 0-100

  per = Math.floor(per * 100) / 100; // Round to 2 decimal places

  return per;
}

export default Component.extend({
  intl: service(),

  layout,
  tagName:              'div',
  classNames:           ['progress-bar-multi'],
  showTooltip:          true,

  values:               null,
  colorKey:             'color',
  labelKey:             'label',
  valueKey:             'value',
  translatedLabels:     true,
  min:                  0,
  max:                  null,
  minPercent:           5,
  showZeros:            false,

  init() {
    this._super(...arguments);

    const colorKey = get(this, 'colorKey');
    const labelKey = get(this, 'labelKey');
    const valueKey = get(this, 'valueKey');
    const translatedLabels = get(this, 'translatedLabels');
    const showZeros = get(this, 'showZeros');
    const intl = get(this, 'intl');

    let valueDep = `values.@each.{${ colorKey },${ labelKey },${ valueKey }}`;

    defineProperty(this, 'pieces',  computed('min', 'max', 'intl.locale', 'translatedLabels', valueDep, () => {
      let min = get(this, 'min');
      let max = get(this, 'max');

      var out = [];

      (get(this, 'values') || []).forEach((obj) => {
        const label = get(obj, labelKey);
        const value = get(obj, valueKey);

        if ( value === 0 && !showZeros ) {
          return;
        }

        out.push({
          color: get(obj, colorKey),
          label: (translatedLabels ? intl.t(label) : label),
          value: get(obj, valueKey),
        });
      });

      if ( !max ) {
        max = 100;
        if ( out.length ) {
          max = out.map((x) => x.value).reduce((a, b) => a + b);
        }
      }

      let sum = 0;
      let minPercent = get(this, 'minPercent');

      out.forEach((obj) => {
        let per = Math.max(minPercent, toPercent(obj.value, min, max));

        obj.percent = per;
        sum += per;
      });

      // If the sum is bigger than 100%, take it out of the biggest piece.
      if ( sum > 100 ) {
        out.sortBy('percent').reverse()[0].percent -= sum - 100;
      }

      out.forEach((obj) => {
        obj.css = (`width: ${  obj.percent }%`).htmlSafe();
      });

      return out.filter((obj) => obj.percent);
    }));
  },
});
