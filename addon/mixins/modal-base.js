import Mixin from '@ember/object/mixin';
import { inject as service } from '@ember/service';
import { alias } from '@ember/object/computed';
import { get } from '@ember/object'
import { KEY } from '@rancher/ember-shared/utils/platform';

export default Mixin.create({
  modal: service(),
  model: alias('modal.model'),

  classNames: ['modal'],

  actions: {
    close() {
      get(this, 'modal').close();
    },
  },

  keyUp(e) {
    if (get(this, 'modal.closeEscape') && e.which === KEY.ESCAPE ) {
      get(this, 'modal').close();
    }
  },
});
