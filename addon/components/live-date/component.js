import Component from '@ember/component';
import { get, set, computed } from '@ember/object';
import { inject as service } from '@ember/service';
import { cancel, later } from '@ember/runloop';
import moment from 'moment';
import { PREF } from '@rancher/ember-shared/utils/constants';
import { escapeHtml } from '@rancher/ember-shared/utils/string';
import layout from './template';

export default Component.extend({
  intl:  service(),
  prefs: service(),
  layout,

  value: null,

  date:  null,
  label: null,
  timer: null,

  didReceiveAttrs() {
    let date = moment(get(this, 'value'));

    set(this, 'date', date);

    this.update();
  },

  willDestroyElement() {
    cancel(get(this, 'timer'));
  },

  title: computed('date', function() {
    const dateFormat = escapeHtml(get(this, `prefs.${ PREF.DATE_FORMAT }`));
    const timeFormat = escapeHtml(get(this, `prefs.${ PREF.TIME_FORMAT }`));
    const date = get(this, 'date');

    return date.format(`${ dateFormat } ${ timeFormat }`);
  }),

  update() {
    if ( this.isDestroyed || this.isDestroying ) {
      return;
    }

    let timer;
    const date = get(this, 'date');
    const now = moment();
    const diff = Math.abs(date.diff(now, 'seconds'));

    cancel(get(this, 'timer'));

    if ( diff < 60 ) {
      set(this, 'label', get(this, 'intl').t('generic.secondsAgo', { seconds: diff }));
      timer = later(this, 'update', 1 * 1000);
    } else {
      set(this, 'label', date.fromNow());

      if ( diff < 600 ) {
        timer = later(this, 'update', 5 * 1000);
      } else {
        timer = later(this, 'update', 60 * 1000);
      }
    }

    set(this, 'timer', timer);
  },
});
