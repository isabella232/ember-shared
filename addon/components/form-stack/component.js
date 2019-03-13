import Component from '@ember/component';
import { get, set, observer } from '@ember/object';
import { reject } from 'rsvp';
import { once } from '@ember/runloop';
import { inject as service } from '@ember/service';
import layout from './template';

export default Component.extend({
  intl:  service(),
  store: service(),
  layout,

  stacks: null,
  stack:  null,

  create:   null,
  newStack: null,
  errors:   null,

  init() {
    this._super(...arguments);

    if ( this.ignoreFields ) {
      this.ignoreFields('stackId');
    }

    if ( this.registerBeforeHook ) {
      this.registerBeforeHook(this.save.bind(this), 'saveStack', 10);
    } else {
      throw new Error('Must pass in registerBeforeHook action')
    }

    const stack = get(this, 'stack');
    const choices = get(this, 'stacks');
    const def = choices.findBy('isDefault');

    set(this, 'newStack', get(this, 'store').createRecord({
      type: 'stack',
      name: ''
    }));

    if ( stack && choices.includes(stack) ) {
      set(this, 'create', false);
    } else if ( def ) {
      this.send('existingChanged', def);
    } else {
      set(this, 'create', true);
    }

    this.validate();
  },

  actions: {
    existingChanged(stack) {
      set(this, 'create', false);
      set(this, 'stack', stack);
      once(this, 'validate');
    }
  },

  nameChanged: observer('newStack.name', function() {
    set(this, 'create', true);
    once(this, 'validate');
  }),

  validate() {
    let intl = get(this, 'intl');
    let errors = [];

    let stack = get(this, 'stack');

    if ( stack && get(stack, 'name') ) {
      stack.validationErrors().forEach((err) => {
        errors.push(intl.t('formStack.errors.validation', { error: err }))
      });
    } else {
      errors.push(intl.t('validation.required', { key: intl.t('generic.stack') }));
    }

    if ( errors.length ) {
      set(this, 'errors', errors);
    } else {
      set(this, 'errors', null);
    }
  },

  save(primaryResource) {
    if (this.isDestroyed || this.isDestroying ) {
      return;
    }

    if ( get(this, 'create') ) {
      const stack = get(this, 'newStack');

      return stack.save().then(() => {
        set(this, 'create', false);
        set(this, 'stack', stack);
        set(primaryResource, 'stackId', get(stack, 'id'));
      }).catch((err) => {
        set(this, 'errors', [err.message]);

        return reject(err);
      });
    } else {
      set(primaryResource, 'stackId', get(this, 'stack.id'));
    }
  },
});
