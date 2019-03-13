import Mixin from '@ember/object/mixin';
import { get, set } from '@ember/object';
import { hash } from 'rsvp';

let NEXT_ID = 1;

export const BEFORE_SAVE_HOOKS = '_beforeSaveHooks';
export const AFTER_SAVE_HOOKS  = '_afterSaveHooks';

export default Mixin.create({
  actions: {
    registerBeforeHook(boundFn, name, priority) {
      this._registerHook(BEFORE_SAVE_HOOKS, boundFn, name, priority);
    },

    registerAfterHook(boundFn, name, priority) {
      this._registerHook(AFTER_SAVE_HOOKS, boundFn, name, priority);
    },
  },

  applyHooks(key, ...args) {
    if ( !key ) {
      throw new Error('Must specify key');
    }

    const hooks = (get(this, key) || []).sortBy('priority', 'name');
    const promises = {};

    hooks.forEach((x) => {
      promises[x.name] = x.fn(...args);
    });

    return hash(promises);
  },

  _registerHook(key, fn, name, priority) {
    if ( !key ) {
      throw new Error('Must specify key');
    }

    if ( !name ) {
      name = `hook_${  NEXT_ID }`;
      NEXT_ID++;
    }

    if ( !priority ) {
      priority = 99;
    }

    let hooks = get(this, key);

    if ( !hooks ) {
      hooks = [];
      set(this, key, hooks);
    }

    let entry = hooks.findBy('name', name);

    if ( entry ) {
      entry.priority = priority;
      entry.fn = fn;
    } else {
      entry = {
        name,
        priority,
        fn
      };

      hooks.push(entry);
    }
  },
});
