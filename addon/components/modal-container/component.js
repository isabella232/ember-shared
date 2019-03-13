import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { alias } from '@ember/object/computed';
import { get } from '@ember/object';
import $ from 'jquery';
import layout from './template';

export default Component.extend({
  modal: service(),

  layout,

  tagName:           'div',
  classNames:        'modal-container',
  classNameBindings: ['visible:open:closed'],

  component:         alias('modal.component'),
  model:             alias('modal.model'),
  closeOutsideClick: alias('modal.closeOutsideClick'),
  visible:           alias('modal.visible'),

  click(e) {
    if ( get(this, 'visible') && get(this, 'closeOutsideClick') && $(e).target === this.element ) {
      get(this, 'modal').hide();
    }
  }
});
