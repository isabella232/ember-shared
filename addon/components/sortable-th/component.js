import { alias } from '@ember/object/computed';
import Component from '@ember/component';
import layout from './template';
import { get, computed } from '@ember/object';

export default Component.extend({
  layout,
  tagName:           'TH',
  classNames:        ['sortable'],
  classNameBindings: ['header.classNames'],
  ariaRole:          ['columnheader'],
  attributeBindings: ['width'],

  sortable: null,
  header:   null,

  current:    alias('sortable.sortBy'),
  descending: alias('sortable.descending'),

  activeAscending: computed('header.name', 'current', 'descending', function() {
    return !get(this, 'descending') && get(this, 'current') === get(this, 'header.name');
  }),

  activeDescending: computed('header.name', 'current', 'descending', function() {
    return get(this, 'descending') && get(this, 'current') === get(this, 'header.name');
  }),

  click() {
    if ( get(this, 'header.sort') ) {
      this.action(get(this, 'header.name'));
    }
  }
});
