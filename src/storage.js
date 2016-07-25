const STORAGE_KEY = '__FLUX__';

function retrieve(key) {
  const fluxStore = JSON.parse(window.localStorage.getItem(STORAGE_KEY)) || {};

  return key ? (fluxStore[key] || null) : fluxStore;
}

function store(key, value) {
  const fluxStore = retrieve();
  fluxStore[key] = value;

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fluxStore));
}

function clear(key) {
  if (key) {
    const stored = retrieve();
    delete stored[key];

    if (Object.keys(stored).length) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } else {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}

export {
  retrieve,
  store,
  clear,
};
