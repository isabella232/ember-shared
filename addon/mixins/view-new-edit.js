import Mixin from '@ember/object/mixin';
import { computed, get, set, defineProperty } from '@ember/object'
import { equal, or, alias } from '@ember/object/computed'
import { inject as service } from '@ember/service';
import { isArray } from '@ember/array';

import Resource from '@rancher/ember-api-store/models/resource';
import ChildHook, { BEFORE_SAVE_HOOKS, AFTER_SAVE_HOOKS } from 'shared/mixins/child-hook';

import { stringify } from 'shared/utils/error';

export const VIEW   = 'view';
export const CREATE = 'create';
export const EDIT   = 'edit';

export default Mixin.create(ChildHook, {
  intl: service(),

  tagName: 'form', // This indirectly disables global navigation shortcut keys

  titleKey:                null,
  primaryResource:         alias('model'),
  originalPrimaryResource: null,

  primaryErrors: null,
  errorSources:  null, // Additional properties where errors come from to be combined into "errors".  NOT LIVE UPDATEABLE.

  _ignoreFields: null, // Fields to not validate, e.g. because a saveHook will populate them later

  init() {
    this._super();

    const errorSources = get(this, 'errorSources') || [];

    defineProperty(this, 'errors', computed('primaryErrors', ...errorSources, {
      get() {
        const out = (get(this, 'primaryErrors') || [] ).slice();
        let i, more;

        for ( i = 0 ; i < errorSources.length ; i++ ) {
          more = get(this, errorSources[i]);
          if ( more ) {
            out.addObjects(more);
          }
        }

        if ( out.length ) {
          return out;
        }

        return null;
      },

      set() {
        throw new Error('Set primaryErrors or add a new entry to errorSources instead of editing errors directly');
      }
    }));
  },

  isView:   equal('mode', VIEW),
  isCreate: equal('mode', CREATE),
  isEdit:   equal('mode', EDIT),
  notView:  or('isCreate', 'isEdit'),

  actions: {
    goToPrevious() {
      if ( this.goToPrevious ) {
        this.goToPrevious();
      }
    },

    cancel() {
      this.send('goToPrevious');
    },

    error(err) {
      if (err) {
        var body = stringify(err);

        set(this, 'primaryErrors', [body]);
      } else {
        set(this, 'primaryErrors', null);
      }
    },

    ignoreFields(add, remove) {
      let fields = get(this, '_ignoreFields');

      if ( !fields ) {
        fields = [];
        set(this, '_ignoreFields', fields);
      }

      if ( !add ) {
        add = [];
      } else if ( !isArray(add) ) {
        add = [add];
      }

      if ( !remove ) {
        remove = [];
      } else if ( !isArray(remove) ) {
        remove = [remove];
      }

      fields.addObjects(add);
      fields.removeObjects(remove);
    },

    async save(cb) {
      cb = cb || function() {};

      try {
        let res;

        if ( await this.validate() === false ) {
          cb(false);

          return;
        }

        if ( await this.willSave() === false ) {
          cb(false);

          return;
        }

        res = await this.doSave();
        res = await this.didSave(res);
        res = await this.doneSaving(res);
        cb(true);

        return res;
      } catch (err) {
        this.send('error', err);
        await this.errorSaving(err);
        cb(false);
      }
    },
  },

  title: computed('mode', 'primaryResource.displayName', 'titleKey', function() {
    const prefix = get(this, 'titleKey');
    const mode = get(this, 'mode');
    const intl = get(this, 'intl');

    let name = get(this, 'originalModel.displayName')
            || get(this, 'primaryResource.displayName')
            || '';

    return intl.t(`${ prefix }.${ mode }`, { name });
  }),

  // validate happens before willSave and can stop the save from happening by returning false
  validate() {
    const model = get(this, 'primaryResource');
    const errors = model.validationErrors(get(this, '_ignoreFields'));

    if ( errors.get('length') ) {
      set(this, 'primaryErrors', errors);

      return false;
    }

    set(this, 'primaryErrors', null);

    return true;
  },

  // willSave happens before save, to create other dependent resources save may need.
  // It can stop the save from happening by returning false
  willSave() {
    const model = get(this, 'primaryResource');

    return this.applyHooks(BEFORE_SAVE_HOOKS, model);
  },

  // doSave saves the primaryResource
  doSave(opt) {
    const model = get(this, 'primaryResource');

    return model.save(opt).then((newData) => {
      return this.mergeResult(newData);
    });
  },

  // didSave can be used to do additional saving of dependent resources that need the primary resource
  async didSave(res) {
    const model = get(this, 'primaryResource');

    await this.applyHooks(AFTER_SAVE_HOOKS, model);

    return res;
  },

  // doneSaving happens after didSave
  doneSaving(res) {
    this.send('goToPrevious');

    return res || get(this, 'originalPrimaryResource') || get(this, 'primaryResource');
  },

  // errorSaving happens if any step fails and can be used to do additional cleanup of dependent resources
  errorSaving(/* err*/) {
  },

  // submit happens from native form submit
  submit(event) {
    event.preventDefault();
    this.send('save');
  },

  mergeResult(newData) {
    const original = get(this, 'originalPrimaryResource');

    if ( original ) {
      if ( Resource.detectInstance(original) ) {
        original.merge(newData);

        return original;
      }
    }

    return newData;
  },

});
