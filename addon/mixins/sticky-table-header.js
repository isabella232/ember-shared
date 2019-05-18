import { throttle } from '@ember/runloop';
import { inject as service } from '@ember/service';
import { get, set, computed } from '@ember/object';
import $ from 'jquery';
import Mixin from '@ember/object/mixin';

const headerHeight = 80;

let NEXT_ID = 1;

export default Mixin.create({
  fastboot: service(),

  stickyHeader: true,
  scrollElement: window,

  isFixed: false,
  tableId: null,

  didInsertElement() {
    this._super(...arguments);

    if ( get(this, 'fastboot').isFastBoot ) {
      return;
    }

    set(this, 'tableId', NEXT_ID++);

    if ( !get(this, 'stickyHeader') ) {
      return;
    }

    this.positionHeader();

    set(this, '_boundScroll', this._scroll.bind(this));
    $(get(this, '_scrollElement')).on('scroll', get(this, '_boundScroll'));
  },

  _boundScroll: null,
  _scroll() {
    throttle(() => {
      this.updateHeaders();
    }, 30);
  },

  _scrollElement: computed('scrollElement', function() {
    const val = get(this, 'scrollElement');

    if ( val === 'self' ) {
      return thi.element;
    } else if ( typeof val === 'string' ) {
      return $(val)[0];
    } else {
      return window;
    }
  }),

  willDestroyElement() {
    this._super(...arguments);

    if ( get(this, 'fastboot').isFastBoot || !get(this, 'stickyHeader')) {
      return;
    }

    $(get(this, '_scrollElement')).off('scroll', get(this, '_boundScroll'));
  },

  positionHeader() {
    if ( get(this, 'fastboot').isFastBoot || !get(this, 'stickyHeader')) {
      return;
    }

    let $elem           = $(this.element);
    let $header         = $elem.find('> .header');
    let $table          = $elem.find('> table');

    if ( get(this, 'isFixed') ) {
      const scroll = $(get(this, '_scrollElement'));
      const left   = $table.offset().left;
      const width  = $table.width();

      $header.css({
        position: 'fixed',
        top:      0,
        height:   `${ headerHeight }px`,
        left,
        width,
      });

      $elem.css({ 'padding-top': `${ headerHeight }px` });
    } else {
      $header.css({
        'position': '',
        'top':      '',
        'left':     '',
        'right':    '',
        'height':   'auto',
      });

      $elem.css({ 'padding-top': 0 });
    }
  },

  updateHeaders() {
    if ( get(this, 'fastboot').isFastBoot || !get(this, 'stickyHeader')) {
      return;
    }

    let $elem           = $(this.element);
    let $header         = $elem.find('> .header');
    let scrollTop      = $(get(this, '_scrollElement')).scrollTop();
    let offset          = $elem.find('> table > thead > tr').offset().top - parseInt($elem.css('padding-top'), 10);

    if ( get(this, 'isFixed') ) {
      if ( offset >= scrollTop  ) {
        set(this, 'isFixed', false);
        this.positionHeader();
      }
    } else {
      if ( $header.offset().top <= scrollTop ) {
        set(this, 'isFixed', true);
        this.positionHeader();
      }
    }
  }
});
