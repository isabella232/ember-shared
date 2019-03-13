import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { get } from '@ember/object';
import { resolve } from 'rsvp';

import Modal from 'shared/mixins/modal-base';
import { eachLimit } from 'shared/utils/promise-limit';
import layout from './template';

export default Component.extend(Modal, {
  modal: service(),

  layout,

  actions: {
    delete(cb) {
      const resources = ( get(this, 'model.resources') || [] ).slice().reverse();

      eachLimit(resources, 5, (resource) => {
        if ( !resource ) {
          return resolve();
        }

        return resource.delete().catch(() => {
          // Absorb errors and delete what can be
          return resolve();
        });
      });

      cb();
      get(this, 'modal').hide();
    },

    cancel() {
      get(this, 'modal').hide();
    }
  },
});
