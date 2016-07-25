import jsdom from 'jsdom';

// A minimal mock of the parts we need from window.Storage (i.e., LocalStorage)
class Storage {
  constructor() {
    this._store = {};
  }

  getItem(key) {
    return this._store[key] || null;
  }

  setItem(key, value) {
    // Naively stringify the key and value because Storage uses DOMString for both:
    // https://developer.mozilla.org/en-US/docs/Web/API/Storage/setItem
    this._store[String(key)] = String(value);
  }

  removeItem(key) {
    delete this._store[key];
  }
}

function noOp() { }

function createTestWindow() {
  const window = jsdom.jsdom('<html><head></head><body></body></html>').defaultView;
  window.localStorage = global.localStorage = new Storage();

  // We don't actually care about what these are, but the browser SDK assumes that it's
  // being called in a browser context and needs them to be defined.
  window.WebSocket = global.WebSocket = noOp;
  window.atob = global.atob = noOp;
  window.btoa = global.btoa = noOp;
  window.fetch = global.fetch = noOp;

  return window;
}

export default createTestWindow;
