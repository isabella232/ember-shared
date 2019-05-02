import Component from '@ember/component';
import layout from './template';
import { get } from '@ember/object';
import { inject as service } from '@ember/service';

export default Component.extend({
  router: service(),

  classNames: ['text-left', 'pt-10'],

  layout,

  mode:      'save',
  canCancel: true,
  errors:    null,

  actions: {
    action() {
      if ( this.action ) {
        this.action(...arguments);
      } else {
        throw new Error('"action" must be provided for action-cancel');
      }
    },

    cancel() {
      if ( this.cancel ) {
        this.cancel(...arguments);

        return;
      }

      const router = get(this, 'router');

      if ( router && router.goToParent ) {
        router.goToParent();

        return;
      }

      throw new Error('Either "cancel" or router.goToParent must be implemented for action-cancel');
    }
  }
});
