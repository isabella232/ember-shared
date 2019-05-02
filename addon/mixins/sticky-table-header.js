import { throttle } from '@ember/runloop';
import { inject as service } from '@ember/service';
import { get, set } from '@ember/object';
import $ from 'jquery';
import Mixin from '@ember/object/mixin';

const headerHeight = 80;

let NEXT_ID = 1;

export default Mixin.create({
  fastboot: service(),

  stickyHeader: true,

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
    $(window).on('scroll', get(this, '_boundScroll'));
  },

  _boundScroll: null,
  _scroll() {
    throttle(() => {
      this.updateHeaders();
    }, 30);
  },


  willDestroyElement() {
    this._super(...arguments);

    if ( get(this, 'fastboot').isFastBoot || !get(this, 'stickyHeader')) {
      return;
    }

    $(window).off('scroll', get(this, '_boundScroll'));
  },

  positionHeader() {
    if ( get(this, 'fastboot').isFastBoot || !get(this, 'stickyHeader')) {
      return;
    }

    let $elem           = $(this.element);
    let $header         = $elem.find('> .header');
    let $table          = $elem.find('> table');

    if ( get(this, 'isFixed') ) {
      const left   = $table.offset().left;
      const right  = $(window).width() - left - $table.width();

      $header.css({
        position: 'fixed',
        top:      0,
        height:   `${ headerHeight }px`,
        left,
        right,
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
    let scrollTop      = $(window).scrollTop();
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
