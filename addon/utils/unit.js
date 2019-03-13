const UNITS =      ['', 'K', 'M', 'G', 'T', 'P'];
const FRACTIONAL = ['', 'm', 'u', 'n', 'p', 'f']; // milli micro nano pico femto

export function formatSi(val, opt) {
  opt = opt || {};
  const increment = opt.increment || 1000;
  const suffix = opt.suffix;
  const firstSuffix = opt.firstSuffix;
  const startingExponent = opt.startingExponent || 0;
  const minExponent = opt.minExponent || 0
  const maxPrecision = (typeof opt.maxPrecision === 'undefined' ? 2 : opt.maxPrecision);

  var exp = startingExponent;

  while ( val >= increment && exp + 1 < UNITS.length || exp < minExponent ) {
    val = val / increment;
    exp++;
  }

  var out = '';

  if ( val < 10 && maxPrecision >= 2 ) {
    out = Math.round(val * 100) / 100;
  } else if ( val < 100  && maxPrecision >= 1) {
    out = Math.round(val * 10) / 10;
  } else {
    out = Math.round(val);
  }

  if ( exp === 0 && firstSuffix !== null) {
    out += ` ${  firstSuffix }`;
  } else {
    out += ` ${  UNITS[exp]  }${ suffix }` || '';
  }

  return out;
}

export function exponentNeeded(val, increment = 1000) {
  let exp = 0;

  while ( val >= increment ) {
    val = val / increment;
    exp++;
  }

  return exp;
}

export function parseSi(inValue, increment = null, allowFractional = true) {
  if ( !inValue || typeof inValue !== 'string' || !inValue.length ) {
    return NaN;
  }

  inValue = inValue.replace(/,/g, '')

  let [, valStr, unit, incStr] = inValue.match(/^([0-9.-]+)\s*([^0-9.-]?)([^0-9.-]?)/);
  const val = parseFloat(valStr);

  if ( !unit ) {
    return val;
  }

  // micro "mu" symbol -> u
  if ( unit.charCodeAt(0) === 181 ) {
    unit = 'u';
  }

  const divide = FRACTIONAL.includes(unit);
  const multiply = UNITS.includes(unit.toUpperCase());

  if ( increment === null ) {
    // Automatically handle 1 KB = 1000B, 1 KiB = 1024B if no increment set
    if ( (multiply || divide) && incStr === 'i' ) {
      increment = 1024;
    } else {
      increment = 1000;
    }
  }

  if ( divide && allowFractional ) {
    const exp = FRACTIONAL.indexOf(unit);

    return val / Math.pow(increment, exp);
  }

  if ( multiply ) {
    const exp = UNITS.indexOf(unit.toUpperCase());

    return val * Math.pow(increment, exp);
  }

  // Unrecognized unit character
  return val;
}

export function formatBytes(inBytes) {
  return formatSi(inBytes, {
    increment:   1024,
    suffix:      'B',
    firstSuffix: 'B'
  });
}

export function formatGb(inGb) {
  return formatSi(inGb, {
    increment:        1000,
    suffix:           'B',
    firstSuffix:      'B',
    startingExponent: 3,
  });
}
