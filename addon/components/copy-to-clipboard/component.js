import { get, set, computed } from '@ember/object';
import { later, cancel } from '@ember/runloop';
import Component from '@ember/component';
import { isSafari } from '@rancher/ember-shared/utils/platform';
import layout from './template';

const DELAY        = 1000;

const NORMAL = 'normal';
const SUCCESS = 'success';
const ERROR = 'error';

const isSupported = !isSafari || (document && document.queryCommandSupported('copy'));

export default Component.extend({
  layout,
  tagName: '',

  // Provide one or the other for the content
  target: null, // CSS selector to get text from
  text:   null,

  label:        'copyToClipboard.label.normal',
  successLabel: 'copyToClipboard.label.success',
  errorLabel:   'copyToClipboard.label.error',

  color:        'bg-transparent',
  successColor: 'bg-success',
  errorColor:   'bg-error',

  icon:  'icon-copy',

  state: NORMAL,
  timer: null,
  isSupported,

  actions: {
    success() {
      this.tempState(SUCCESS);
    },

    error() {
      this.tempState(ERROR);
    }
  },

  buttonClasses: computed('isSupported', 'state', function() {
    let state = get(this, 'state');
    let out = ['btn'];

    if ( !get(this, 'isSupported') ) {
      out.push('hide');
    }

    if ( state === NORMAL ) {
      out.push(get(this, 'color'));
    } else {
      out.push(get(this, `${ state }Color`));
    }

    return out.join(' ');
  }),

  labelKey: computed('state', function() {
    let state = get(this, 'state');

    if ( state === NORMAL ) {
      return get(this, 'label');
    } else {
      return get(this, `${ state }Label`);
    }
  }),

  tempState(state) {
    cancel(get(this, 'timer'));

    set(this, 'state', state);

    set(this, 'timer', later(() => {
      if ( this.isDestroyed || this.isDestroying ) {
        return;
      }
      set(this, 'state', NORMAL);
    }, DELAY));
  },

});
