export default function missingMessage(key, locales /* options */) {
  if ( !key ) {
    return '';
  }

  if ( locales.length === 0 ) {
    return key;
  }

  console.warn(`Translation not found: key=${ key }, locales=${ locales.join(', ') }`);

  return `@(${ key })`
}
