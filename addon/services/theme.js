import Service, { inject as service } from '@ember/service';
import { get, set, computed } from '@ember/object';
import { PREF, COOKIE } from '@rancher/ember-shared/utils/constants';

const DEFAULT = 'dark'; // If there's no setting/cookie, this will be used

export default Service.extend({
  cookies: service(),
  prefs:   service(),
  session: service(),

  usePref: true,

  current: computed(`prefs.${ PREF.THEME }`, `session.isAuthenticated`, {
    get() {
      return this._getCurrent();
    },

    set(key, theme) {
      this._setCurrent(theme);

      return theme;
    }
  }),

  _getCurrent() {
    const cookies = get(this, 'cookies');
    const cookie = cookies.read(COOKIE.THEME, { raw: true })
    let pref = null;

    if ( get(this, 'usePref') && get(this, 'session.isAuthenticated') ) {
      pref = get(this, `prefs.${ PREF.THEME }`);
    }

    let out = pref || cookie || DEFAULT;

    if ( out !== cookie ) {
      cookies.write(COOKIE.THEME, out, COOKIE.LONG_LIVED);
    }

    return out;
  },

  _setCurrent(theme) {
    const cookies = get(this, 'cookies');

    if ( get(this, 'usePref') ) {
      set(this, `prefs.${ PREF.THEME }`, theme);
    }

    const existing = cookies.read(COOKIE.THEME, { raw: true })

    if ( existing !== theme ) {
      cookies.write(COOKIE.THEME, theme, COOKIE.LONG_LIVED);
    }
  },
});
