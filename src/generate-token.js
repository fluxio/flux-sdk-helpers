function randomInt(low, high) {
  return Math.floor((Math.random() * (high - low)) + low);
}

// Based on https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding
/* eslint-disable */
function b64EncodeUnicode(str) {
  return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function(match, p1) {
    return String.fromCharCode('0x' + p1);
  }));
}
/* eslint-enable */

function generateToken() {
  const crypto = window.crypto || window.msCrypto;
  let randomNumbers = null;

  if (crypto && crypto.getRandomValues && window.Uint32Array) {
    randomNumbers = crypto.getRandomValues(new Uint32Array(4));
  } else {
    // This method (including randomInt above) is based on
    // https://blog.tompawlak.org/generate-random-values-nodejs-javascript
    randomNumbers = [];

    for (let i = 0; i < 36; i++) {
      randomNumbers.push(randomInt(0, 10));
    }
  }

  return b64EncodeUnicode(randomNumbers.join('')).slice(0, 48).replace(/\+|\/]/g, '0');
}

export default generateToken;
