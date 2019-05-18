import { later, cancel } from '@ember/runloop';
import { get, set, setProperties, computed,  } from '@ember/object';
import Service from '@ember/service';

const DELAY = 5000;

export default Service.extend({
  component: null,
  model:     null,
  opt:       null,

  visible: false,
  timer:   null,

  // On by default
  closeEscape: computed('opt.closeEscape', function() {
    return get(this, 'opt.closeEscape') !== false;
  }),

  // Off by default
  closeOutsideClick: computed('opt.closeOutsideClick', function() {
    return get(this, 'opt.closeOutsideClick') === true;
  }),

  show(component, model, opt) {
    cancel(get(this, 'timer'));

    setProperties(this, {
      component,
      model,
      opt: opt || {},
      visible: true
    });
  },

  hide() {
    set(this, 'visible', false);
    set(this, 'timer', later(this, 'clear', DELAY));
  },

  clear() {
    setProperties(this, {
      component: null,
      model:     null,
      opt:       null,
    });
  }
});
