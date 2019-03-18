import TextArea from '@ember/component/text-area';
import { get } from '@ember/object';

import ThrottledResize from '@rancher/ember-shared/mixins/throttled-resize';

export default TextArea.extend(ThrottledResize, {
  tagName:           'textarea',
  classNames:        ['no-resize', 'no-ease'],
  attributeBindings: ['spellcheck'],

  autoResize:  true,
  footerSpace: 100,
  minHeight:   50,

  onResize() {
    if ( get(this, 'autoResize') ) {
      this.fit();
    }
  },

  fit() {
    if ( get(this, 'autoResize') ) {
      var container = this.$();

      const offset = container.offset();

      if ( !offset ) {
        return;
      }

      const desired = this.$(window).height() - offset.top - get(this, 'footerSpace');

      container.css('height', Math.max(get(this, 'minHeight'), desired));
    }
  },
});
