export function addQueryParam(url, key, val) {
  let out = url + (url.indexOf('?') >= 0 ? '&' : '?');

  // val can be a string or an array of strings
  if ( !Array.isArray(val) ) {
    val = [val];
  }
  out += val.map((v) => {
    return `${ encodeURIComponent(key)  }=${  encodeURIComponent(v) }`;
  }).join('&');

  return out;
}

export function addQueryParams(url, params) {
  if ( params && typeof params === 'object' ) {
    Object.keys(params).forEach((key) => {
      url = addQueryParam(url, key, params[key]);
    });
  }

  return url;
}

export function parseUrl(url) {
  var a = document.createElement('a');

  a.href = url;

  return a.cloneNode(false);
}

export function absoluteUrl(url) {
  return parseUrl(url).href;
}
