import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { get } from '@ember/object';
import { resolve } from 'rsvp';

import Modal from '@rancher/ember-shared/mixins/modal-base';
import { eachLimit } from '@rancher/ember-shared/utils/promise-limit';
import layout from './template';

export default Component.extend(Modal, {
  modal: service(),

  layout,

  displayField: 'displayName',


  actions: {
    delete(cb) {
      const model = get(this, 'model');
      const resources = ( get(model, 'resources') || [] ).slice().reverse();

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

      const after = get(model, 'after');

      if ( after ) {
        after(model);
      }
    },

    cancel() {
      get(this, 'modal').hide();
    }
  },
});
