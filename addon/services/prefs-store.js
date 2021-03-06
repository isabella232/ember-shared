import Service from '@ember/service';
import { get, set, computed } from '@ember/object';
import { resolve } from 'rsvp';
import { PREF_DEFAULTS } from '@rancher/ember-shared/utils/constants';

export default Service.extend({
  store: null, // define me

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
        obj.delete();
        this.notifyPropertyChange(key);
      }

      return;
    }

    if ( !obj ) {
      obj = get(this, 'store').createRecord({
        type: 'preference',
        name: key,
      });
    }

    let neu = JSON.stringify(value);

    if ( !obj.get('id') || obj.get('value') !== neu ) {
      obj.set('value', neu);
      obj.save().catch((err) => {
        console.log('Error saving preference', err);

        return resolve(value);
      }).finally(() => {
        this.notifyPropertyChange(key);
      });
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

  unremoved: computed('store.generation', function() {
    return get(this, 'store').all('preference');
  }),
});
