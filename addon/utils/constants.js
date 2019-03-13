/* eslint-disable object-curly-newline */

import config from './config/environment'

const COOKIE_PREFIX = config.cookiePrefix || 'R_';
const PREF_PREFIX = config.prefPrefix || 'r-';

export const COOKIE = {
  AUTH:    `${ COOKIE_PREFIX }STATE`,
  CSRF:    'CSRF',

  BACK_TO:      `${ COOKIE_PREFIX }BACK_TO`,
  BACK_TO_OPTS: {
    path:   '/',
    secure: true,
  },

  LANG:      `${ COOKIE_PREFIX }LANG`,
  LANG_SAVE: `${ COOKIE_PREFIX }LANG_SAVE`,

  LONG_LIVED: {
    maxAge: 365 * 86400,
    path:   '/',
    secure: true,
    raw:    true,
  },

  THEME: `${ COOKIE_PREFIX }THEME`,
};

export const HEADER = {
  ACTIONS_FIELD:        'X-Api-Action-Links',
  ACTIONS_FIELD_VALUE:  'actionLinks',
  CSRF:                 'X-Api-Csrf',
  NO_CHALLENGE:         'X-Api-No-Challenge',
  NO_CHALLENGE_VALUE:   'true',
};

export const PREF = {
  DATE_FORMAT:          `${ PREF_PREFIX }date-format`,
  LANG:                 `${ PREF_PREFIX }lang`,
  CUSTOMER_ID:          `${ PREF_PREFIX }customer-id`,
  EDITOR_KEYMAP:        `${ PREF_PREFIX }editor-keymap`,
  PROJECT_ID:           `${ PREF_PREFIX }default-project-id`,
  SUBSCRIPTION_ID:      `${ PREF_PREFIX }subscription-id`,
  TABLE_ROWS_PER_PAGE:  `${ PREF_PREFIX }table-rows-per-page`,
  THEME:                `${ PREF_PREFIX }theme`,
  TIME_FORMAT:          `${ PREF_PREFIX }time-format`,
  TIME_ZONE:            `${ PREF_PREFIX }time-zone`,
};

export const PREF_DEFAULTS = {
  [PREF.EDITOR_KEYMAP]:       'default',
  [PREF.LANG]:                'en-us',
  [PREF.TABLE_ROWS_PER_PAGE]: 250,
  [PREF.DATE_FORMAT]:         'ddd, MMM D, Y',
  [PREF.TIME_FORMAT]:         'h:mm:ss a',
  [PREF.TIME_ZONE]:           'local'
};

export const SESSION = {
  DESCRIPTION: 'UI Session',
  TTL:         16 * 60 * 60 * 1000,
};

export const STATES = {
  REMOVEDISH: [
    'removed',
  ],
}

export const SUBSCRIBE = {
  DISCONNECTED_TIMEOUT: 30000,
};
