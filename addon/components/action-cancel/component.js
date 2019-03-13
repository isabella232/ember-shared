import Component from '@ember/component';
import layout from './template';

export default Component.extend({
  classNames: ['text-left', 'pt-10'],

  layout,

  mode:      'save',
  canCancel: true,
  errors:    null,

  actions: {
    action() {
      this.action(...arguments);
    },

    cancel() {
      this.cancel(...arguments);
    }
  }
});
