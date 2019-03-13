import Component from '@ember/component';
import { get, set, computed } from '@ember/object';

export default Component.extend({
  tagName:           'input',
  type:              'radio',

  disabled:  false,
  value:     null,
  selection: null,

  attributeBindings: ['name', 'type', 'checked', 'disabled'],

  checked: computed('value', 'selection', function() {
    return get(this, 'value') === get(this, 'selection');
  }),

  click() {
    set(this, 'selection', get(this, 'value'));
  },

});
