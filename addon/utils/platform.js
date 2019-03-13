if ( typeof window.navigator === 'undefined' ) {
  var _createdNavigator = true;

  window.navigator = {
    platform:  'FastBoot',
    userAgent: 'FastBoot'
  };
}

export var platform = (window.navigator.platform || '').toLowerCase();
export var isLinuxy = platform.indexOf('linux') >= 0 || platform.indexOf('unix') >= 0;
export var isMac = platform.indexOf('mac') >= 0;
export var isWin = platform.indexOf('win') >= 0;

export var alternateKey = 'ctrlKey';
export var alternateLabel = 'Control';

export var moreKey = 'ctrlKey';
export var moreLabel = 'Control';

export var rangeKey = 'shiftKey';
export var rangeLabel = 'Shift';

if ( isMac ) {
  alternateKey = 'metaKey';
  alternateLabel = 'Command';
  moreKey = 'metaKey';
  moreLabel = 'Command';
}

export function isAlternate(event) {
  return !!event[alternateKey];
}

export function isMore(event) {
  return !!event[moreKey];
}

export function isRange(event) {
  return !!event[rangeKey];
}

// Only intended to work for Mobile Safari at the moment...
export function version() {
  let match = userAgent.match(/\s+Version\/([0-9.]+)/);

  if ( match ) {
    return parseFloat(match[1]);
  }

  return null;
}

export var userAgent = window.navigator.userAgent;
export var isGecko = userAgent.indexOf('Gecko/') >= 0;
export var isBlink = userAgent.indexOf('Chrome/') >= 0;
export var isWebKit = !isBlink && userAgent.indexOf('AppleWebKit/') >= 0;
export var isSafari = !isBlink && userAgent.indexOf('Safari/') >= 0;
export var isMobile = /Android|webOS|iPhone|iPad|iPod|IEMobile/i.test(userAgent);

export const KEY = {
  LEFT:      37,
  UP:        38,
  RIGHT:     39,
  DOWN:      40,
  ESCAPE:    27,
  CR:        13,
  LF:        10,
  TAB:       9,
  SPACE:     32,
  PAGE_UP:   33,
  PAGE_DOWN: 34,
  HOME:      35,
  END:       36,
};

if ( _createdNavigator ) {
  window.navigator = undefined;
}
