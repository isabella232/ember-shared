import Mixin from '@ember/object/mixin';
import { inject as service } from '@ember/service';
import { get } from '@ember/object';

export default Mixin.create({
  fastboot: service(),

  actions: {
    error(err, transition) {
      this.controllerFor('application').set('error', err);

      transition.abort();

      const fastboot = get(this, 'fastboot');

      if ( fastboot.get('isFastBoot') ) {
        let code = 500;

        if ( err.status && err.status >= 100 && err.status <= 999 ) {
          code = err.status;
        }

        fastboot.set('response.statusCode', code);
      }

      this.intermediateTransitionTo('error');
      return false;
    },
  },
});
