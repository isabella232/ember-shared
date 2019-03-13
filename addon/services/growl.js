import Service, { inject as service } from '@ember/service';
import { stringify } from 'shared/utils/error';
import { get } from '@ember/object';

// import 'jgrowl';
import $ from 'jquery';

export default Service.extend({
  intl: service(),

  init() {
    $.jGrowl.defaults.pool = 6;
    $.jGrowl.defaults.closeTemplate = '<i class="icon icon-x"></i>';
    $.jGrowl.defaults.closerTemplate = `<div><button type="button" class="btn bg-info btn-xs btn-block">${ get(this, 'intl').t('growl.dismissAll') }</button></div>`;
    this._super(...arguments);
  },

  close() {
    $("div.jGrowl").jGrowl("close"); // eslint-disable-line
  },

  raw(title, body, opt) {
    opt = opt || {};

    if ( title ) {
      opt.header = title;
    }

    return $.jGrowl(body, opt);
  },

  success(title, body) {
    this.raw(title, body, { theme: 'success' });
  },

  message(title, body) {
    this.raw(title, body, { theme: 'message' });
  },

  error(title, body) {
    this.raw(title, body, {
      sticky: true,
      theme:  'error'
    });
  },

  fromError(title, err) {
    if ( !err && typeof title === 'object' ) {
      err = title;
      title = 'Error';
    }

    var body = stringify(err);

    this.error(title, body);
  },
});
