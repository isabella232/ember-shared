import TextArea from '@ember/component/text-area';
import { inject as service } from '@ember/service'
import { debounce, later } from '@ember/runloop'
import { get, set, observer } from '@ember/object'
import $ from 'jquery';

import { isGecko } from '@rancher/ember-shared/utils/platform';

export default TextArea.extend({
  intl: service(),

  small:     false,
  minHeight: 0,
  maxHeight: 200,

  curHeight: null,

  tagName:           'textarea',
  classNames:        ['no-resize', 'no-ease'],
  attributeBindings: ['spellcheck', 'style'],

  init() {
    this._super();

    let min = get(this, 'minHeight');

    if ( min === 0 ) {
      min = get(this, 'small') ? 31 : 36;
      set(this, 'minHeight', min);
    }

    set(this, 'style', `height: ${ min }px;`.htmlSafe());
  },

  didInsertElement() {
    this._super();

    this.$().on('paste', () => {
      later(this, 'autoSize', 100);
    });
  },

  valueChanged: observer('value', function() {
    debounce(this, 'autoSize', 100);
  }),

  autoSize() {
    if ( this.isDestroyed || this.isDestroying ) {
      return;
    }

    let el = this.element;
    let $el = $(el); // eslint-disable-line

    $el.css('height', '1px');

    let border = parseInt($el.css('borderTopWidth'), 10) || 0 + parseInt($el.css('borderBottomWidth'), 10) || 0;
    let magic = (get(this, 'small') ? -2 : 0) + ( isGecko ? 1 : 2); // Sigh, but it's wrong without magic fudge
    let neu = Math.max(get(this, 'minHeight'), Math.min(el.scrollHeight + border + magic, get(this, 'maxHeight')));

    $el.css('overflowY', (el.scrollHeight > neu ? 'auto' : 'hidden'));
    $el.css('height', `${ neu  }px`);

    set(this, 'curHeight', neu);
  }
});
