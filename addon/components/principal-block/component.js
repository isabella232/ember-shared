import Component from '@ember/component';
import layout from './template';
import { inject as service } from '@ember/service';
import { get, set } from '@ember/object';
import { next } from '@ember/runloop';

let missingPrincipals = [];

export default Component.extend({
  rancherStore: service(),

  layout,

  // Supply principal or principalId+parsedExternalType
  principal:          null,
  principalId:        null,

  avatar:             true,
  link:               true,
  size:               35,

  loading:            false,
  classNames:         ['gh-block'],
  attributeBindings:  ['aria-label: principal.name'],
  unknownUser:       false,


  init() {
    this._super(...arguments);

    const store            = get(this, 'rancherStore');
    const principalId      = get(this, 'principalId');
    const missingPrincipal = missingPrincipals.includes(principalId);

    if ( get(this, 'principal') ||  missingPrincipal ) {
      return;
    }

    if ( principalId ) {
      let principal = store.getById('principal', principalId);

      if ( principal ) {
        set(this, 'principal', principal);

        return;
      }

      set(this, 'loading', true);

      store.find('principal', principalId, { forceReload: true }).then((principal) => {
        if ( this.isDestroyed || this.isDestroying ) {
          return;
        }

        next(() => {
          set(this, 'principal', principal);
        });
      }).catch((/* err*/) => {
        // Do something..
        missingPrincipals.pushObject(principalId);
      }).finally(() => {
        if ( this.isDestroyed || this.isDestroying ) {
          return;
        }

        set(this, 'loading', false);
        set(this, 'unknownUser', true);
      });
    }
  },

  willDestroy() {
    this._super(...arguments);

    missingPrincipals = [];
    set(this, 'unknownUser', false);
  },


});
