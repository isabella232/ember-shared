import Service, { inject as service } from '@ember/service';
import { get, set, computed } from '@ember/object';
import { resolve } from 'rsvp';
import { PREF_DEFAULTS } from '@rancher/ember-shared/utils/constants';

import config from 'ember-get-config';

export default Service.extend({
  cookies: service(),

  findByName(key) {
    return get(this, 'unremoved').findBy('name', key);
  },

  unknownProperty(key) {
    var value = PREF_DEFAULTS[key];

    var existing = this.findByName(key);

    if ( existing ) {
      try {
        value = JSON.parse(existing.get('value'));
      } catch (e) {
        console.log(`Error parsing storage ['${ key }']`);
        // this.notifyPropertyChange(key);
      }
    }

    return value;
  },

  setUnknownProperty(key, value) {
    if (key === 'app') {
      return value;
    }

    var obj = this.findByName(key);

    // Delete by set to undefined
    if ( value === undefined ) {
      if ( obj ) {
        obj.set('value', undefined);
        get(this, 'cookies').clear(`${config.prefPrefix}${key}`);
        this.notifyPropertyChange(key);
      }

      return;
    }

    if ( !obj ) {
      obj = {
        type: 'preference',
        name: key,
      };
    }

    let neu = JSON.stringify(value);

    if ( obj.get('value') !== neu ) {
      obj.set('value', neu);
      get(this, 'cookies').write(`${config.prefPrefix}${name}`, neu);
      this.notifyPropertyChange(key);
      return neu;
    }

    return value;
  },

  clear() {
    this.beginPropertyChanges();

    get(this, 'unremoved').forEach((obj) => {
      set(this, obj.get('name'), undefined);
    });

    this.endPropertyChanges();
  },

  unremoved: computed(function() {
    const svc = get(this, 'cookies');
    const all = svc.read();
    const prefix = config.prefPrefix;
    const out = [];

    Object.keys(all).forEach((key) => {
      if ( key.startsWith(prefix) ) {
        out.push({ type: 'preference', name: key.substr(prefix.length), value: all[key] });
      }
    });

    return out;
  }),
});
