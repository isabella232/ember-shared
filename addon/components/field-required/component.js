import Component from '@ember/component';
import layout from './template';
import { get, computed } from '@ember/object';

export default Component.extend({
  layout,
  tagName:           'span',
  classNames:        ['field-required'],
  classNameBindings: ['hide'],

  mode: null,

  hide: computed('mode', function() {
    return get(this, 'mode') === 'view';
  })
});
