import Component from '@ember/component';
import { get, set, computed } from '@ember/object';
import { later, cancel } from '@ember/runloop';
import { equal } from '@ember/object/computed';
import layout from './template';

const ACTION = 0, WAITING = 1, SUCCESS = 2, ERROR = 3;
const states = ['action', 'waiting', 'success', 'error'];

const defaultLabel = function(which) {
  return computed('mode', function() {
    return `asyncButton.${ get(this, 'mode') }.${ which }`;
  });
}

export default Component.extend({
  layout,
  tagName: '',

  mode:     'save',
  type:     'button', // Or submit
  delay:    5000,
  state:    ACTION,
  disabled: false,
  action:   null,

  actionColor:  'bg-primary',
  waitingColor: 'bg-primary',
  successColor: 'bg-success',
  errorColor:   'bg-error',

  actionLabel:  defaultLabel('action'),
  waitingLabel: defaultLabel('waiting'),
  successLabel: defaultLabel('success'),
  errorLabel:   defaultLabel('error'),

  spinning: equal('state', WAITING),

  actions: {
    click() {
      if ( get(this, 'reallyDisabled') ) {
        return;
      }

      cancel(get(this, 'timer'));

      set(this, 'state', WAITING);
      this.action((success) => {
        this.done(success);
      });
    },
  },

  color: computed('mode', 'state', function() {
    const v = states[get(this, 'state')];

    if ( v ) {
      return get(this, `${ v }Color`);
    }
  }),

  label: computed('mode', 'state', function() {
    const v = states[get(this, 'state')];

    if ( v ) {
      return get(this, `${ v }Label`);
    }
  }),

  reallyDisabled: computed('disabled', 'state', function() {
    return get(this, 'disabled') || get(this, 'state') === WAITING;
  }),

  done(success) {
    if ( this.isDestroyed || this.isDestroying ) {
      return;
    }

    set(this, 'state', (success ? SUCCESS : ERROR));
    set(this, 'timer', later(this, 'timerDone', get(this, 'delay')));
  },

  timerDone() {
    if ( this.isDestroyed || this.isDestroying ) {
      return;
    }

    const state = get(this, 'state');

    if ( state === SUCCESS || state === ERROR ) {
      set(this, 'state', ACTION);
    }
  },
});
