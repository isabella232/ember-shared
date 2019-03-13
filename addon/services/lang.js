import Service, { inject as service } from '@ember/service';
import { get, set } from '@ember/object';
import { resolve } from 'rsvp';
import { all } from 'rsvp';
import { COOKIE, PREF } from 'shared/utils/constants';
import { loadScript } from 'shared/utils/load-script';

const DEFAULT = 'en-us'; // If there's no setting/cookie, this will be used
const BASE    = 'en-us'; // The base language translations are loaded in addition to the current language as a fallback

export default Service.extend({
  cookies:      service(),
  intl:         service(),
  prefs:        service(),
  rancherStore: service(),
  session:      service(),

  loadedLanguages: null,
  loadedPolyfill:  false,

  init() {
    this._super(...arguments);
    this.loadedLanguages = [];
  },

  getCurrent() {
    const cookies = get(this, 'cookies');
    const lang = cookies.read(COOKIE.LANG, { raw: true })
    const save = cookies.read(COOKIE.LANG_SAVE, { raw: true })

    let out = save || lang || DEFAULT;

    if ( out !== lang ) {
      cookies.write(COOKIE.LANG, out, COOKIE.LONG_LIVED);
    }

    if ( save ) {
      cookies.clear(COOKIE.LANG_SAVE);
    }

    return out;
  },

  setCurrent(lang) {
    const cookies = get(this, 'cookies');
    const current = this.getCurrent();

    if ( get(this, 'session.isAuthenticated') ) {
      if ( get(this, `prefs.${ PREF.LANG }`) !== lang ) {
        set(this, `prefs.${ PREF.LANG }`, lang);
      }
    } else if ( lang !== current ) {
      cookies.write(COOKIE.LANG_SAVE, lang, COOKIE.LONG_LIVED);
      console.log('Saved', lang, 'for after login');
    }

    const existing = cookies.read(COOKIE.LANG, { raw: true })

    if ( existing !== lang ) {
      cookies.write(COOKIE.LANG, lang, COOKIE.LONG_LIVED);
    }
  },

  async switchLanguage(lang) {
    if ( !lang ) {
      lang = this.getCurrent();
    }

    if ( lang === 'none' ) {
      return await get(this, 'intl').setLocale([]);
    }

    const locale = [lang, BASE].uniq();

    await all(locale.map((lang) => {
      return this.loadTranslations(lang);
    }));

    this.setCurrent(lang);
    await get(this, 'intl').setLocale(locale);
  },

  async loadTranslations(lang, engine = '') {
    if ( this.loadedLanguages[lang] ) {
      console.log(lang, 'is already loaded');

      return resolve();
    }

    this.loadedLanguages[lang] = true;

    let path = `/translations/${ lang.toLowerCase() }.json`;

    if ( engine ) {
      path = `/engines-dist/${ engine }${ path }`
    }

    let res = await get(this, 'rancherStore').rawRequest({ url: path });

    await get(this, 'intl').addTranslations(lang, res.body)

    console.log('Loaded', Object.keys(res.body).length, 'translations from', path);
  },

  async loadPolyfill() {
    if ( window && !window.Intl && !get(this, 'loadedPolyfill') ) {
      this.loadedPolyfill = true;
      await loadScript('/assets/intl/intl.min.js');
    }
  },
});
