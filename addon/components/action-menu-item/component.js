import Component from '@ember/component';
import layout from './template';
import { inject as service } from '@ember/service'
import C from 'shared/utils/constants';
import { isAlternate } from 'shared/utils/platform';
import { get, set, observer } from '@ember/object';

export default Component.extend({
  resourceActions: service('resource-actions'),
  layout,
  icon:            'icon-help',
  label:           '',
  prefix:          null,
  enabled:         true,
  actionArg:       null,
  altActionArg:    null,

  tagName:           'a',
  classNameBindings: ['enabled::hide'],
  attributeBindings: ['tabindex'],
  tabindex:          0,


  willRender() {
    var icon = get(this, 'icon');

    if ( icon.indexOf('icon-') === -1 ) {
      set(this, 'prefix', 'icon icon-fw');
    }
  },

  iconChanged: observer('icon', function() {
    this.rerender();
  }),

  click(event) {
    if ( isAlternate(event) && get(this, 'altActionArg')) {
      this.action(get(this, 'altActionArg'));
    } else {
      this.action(get(this, 'actionArg'));
    }
  },

  keyPress(event) {
    if ( [C.KEY.CR, C.KEY.LF].indexOf(event.which) >= 0 ) {
      this.click(event);
      get(this, 'resourceActions').hide();
    }
  },

});
