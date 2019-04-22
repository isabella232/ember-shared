import Mixin from '@ember/object/mixin';
import { inject as service } from '@ember/service';
import { get, set } from '@ember/object';
import { next, schedule, cancel } from '@ember/runloop';
import $ from 'jquery';

export default Mixin.create({
  fastboot: service(),

  loadingShown: false,
  loadingId:    0,
  loadingTimer: null,

  actions: {
    loading(transition) {
      const fastboot = get(this, 'fastboot');

      if ( fastboot.get('isFastBoot') ) {
        return;
      }

      this.incrementProperty('loadingId');
      let id = get(this, 'loadingId');

      cancel(get(this, 'loadingTimer'));

      // console.log('Loading', id);
      if ( !get(this, 'loadingShown') ) {
        set(this, 'loadingShown', true);
        // console.log('Loading Show', id);

        schedule('afterRender', () => {
          $('#loading-overlay').stop().show().fadeIn({// eslint-disable-line
            duration: 100,
            queue:    false,
            easing:   'linear',
            complete: schedule('afterRender', function() { // eslint-disable-line
              $('#loading-content').stop().show().fadeIn({duration: 200, queue: false, easing: 'linear'}); // eslint-disable-line
            })
          });
        });
      }

      transition.finally(() => {
        var self = this;

        function hide() {
          if ( self.isDestroyed || self.isDestroying ) {
            return;
          }

          set(self, 'loadingShown', false);

          schedule('afterRender', () => {
            $('#loading-content').stop().fadeOut({// eslint-disable-line
              duration: 200,
              queue:    false,
              easing:   'linear',
              complete: schedule('afterRender', function() { // eslint-disable-line
                $('#loading-overlay').stop().fadeOut({duration: 100, queue: false, easing: 'linear'}); // eslint-disable-line
              })
            });
          });
        }

        if ( get(this, 'loadingId') === id ) {
          if ( transition.isAborted ) {
            // console.log('Loading aborted', id, get(this, 'loadingId'));
            set(this, 'loadingTimer', next(hide));
          } else {
            // console.log('Loading finished', id, get(this, 'loadingId'));
            hide();
          }
        }
      });

      return true;
    },
  },
});
