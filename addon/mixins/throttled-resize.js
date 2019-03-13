import Mixin from '@ember/object/mixin';
import { inject as service } from '@ember/service';
import { next, throttle, cancel } from '@ember/runloop';
import { get, set } from '@ember/object';
import $ from 'jquery';

export default Mixin.create({
  fastboot:       service(),

  boundResize:    null,
  throttleTimer:  null,
  resizeInterval: 200,
  fireOnInit:     true,

  init() {
    this._super(...arguments);

    if ( get(this, 'fastboot.isFastBoot') ) {
      return;
    }

    set(this, 'boundResize', this.triggerResize.bind(this));
    $(window).on('resize', get(this, 'boundResize'));
    $(window).on('focus', get(this, 'boundResize'));

    if ( get(this, 'fireOnInit') ) {
      next(this, 'onResize');
    }
  },

  triggerResize() {
    if ( this.isDestroyed || this.isDestroying ) {
      return;
    }

    var timer = throttle(this, 'onResize', get(this, 'resizeInterval'), false);

    set(this, 'throttleTimer', timer);
  },

  onResize() {
    // Override me with resize logic
  },

  willDestroyElement() {
    cancel(get(this, 'throttleTimer'));
    $(window).off('resize', get(this, 'boundResize'));
    $(window).off('focus', get(this, 'boundResize'));
  },
});
