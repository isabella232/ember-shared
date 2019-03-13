import { get, set, defineProperty, computed } from '@ember/object';
import { reads } from '@ember/object/computed';

import Component from '@ember/component';
import layout from './template';

export default Component.extend({
  layout,
  tagName:            'select',
  // possible passed-in values with their defaults:
  content:            null,
  prompt:             null,
  optionValuePath:    'value',
  optionLabelPath:    'label',
  optionGroupPath:    'group',
  optionDisabledPath: 'disabled',
  value:              null,
  localizedPrompt:    false,
  localizedLabel:     false,
  localizedHtmlLabel: false,
  disabled:           false,
  cssDisabled:        false,
  attributeBindings:  ['disabled'],
  classNameBindings:  'cssDisabled:disabled',

  ungroupedContent: null,
  groupedContent:   null,

  // leaking changes to it via a 2-way binding
  _selection: reads('selection'),

  // shadow the passed-in `selection` to avoid
  init() {
    this._super(...arguments);
    if (!get(this, 'content')) {
      set(this, 'content', []);
    }

    defineProperty(this, 'ungroupedContent', computed(`content.@each.${ get(this, 'optionGroupPath') }`, () => {
      var groupPath = get(this, 'optionGroupPath');
      var out = [];

      get(this, 'content').forEach((opt) => {
        var key = get(opt, groupPath);

        if ( !key ) {
          out.push(opt);
        }
      });

      return out;
    }));

    defineProperty(this, 'groupedContent', computed(`content.@each.${ get(this, 'optionGroupPath') }`, () => {
      var groupPath = get(this, 'optionGroupPath');
      var out = [];

      get(this, 'content').forEach((opt) => {
        var key = get(opt, groupPath);

        if ( key ) {
          var group = out.filterBy('group', key)[0];

          if ( !group ) {
            group = {
              group:   key,
              options: []
            };
            out.push(group);
          }

          group.options.push(opt);
        }
      });

      return out.sortBy(groupPath);
    }));

    this.on('change', this, this._change);
  },

  willDestroyElement() {
    this.off('change', this, this._change);
  },

  action() {
    return this;
  },

  _change() {
    const selectEl = this.$()[0];
    const selectedIndex = selectEl.selectedIndex;
    const value = get(this, 'value');

    if ( selectedIndex === -1 ) {
      return;
    }

    const selectedValue = selectEl.options[selectedIndex].value;
    const content = get(this, 'content');

    const selection = content.filterBy(get(this, 'optionValuePath'), selectedValue)[0];

    // set the local, shadowed selection to avoid leaking
    // changes to `selection` out via 2-way binding
    set(this, '_selection', selection);

    const changeCallback = get(this, 'action');

    if ( changeCallback ) {
      changeCallback(selection);
    }

    if ( selection ) {
      if (typeof value === 'function') {
        value(get(selection, get(this, 'optionValuePath')));
      } else {
        set(this, 'value', get(selection, get(this, 'optionValuePath')));
      }
    } else {
      set(this, 'value', null);
    }
  }
});
