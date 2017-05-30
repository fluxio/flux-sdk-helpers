import { retrieve, store, clear } from './storage';
import generateToken from './generate-token';

const STATE_KEY = 'state';
const NONCE_KEY = 'nonce';
const CREDENTIALS_KEY = 'credentials';

// Lightweight check: has the user just been redirected from authenticating at Flux?
// The implicit OIDC flow will stick access_token (among other things) in URL hash.
function isLoggingIn() {
  return window.location.hash.search(/access_token/) !== -1;
}

class FluxHelpers {
  constructor(sdk) {
    if (!sdk) {
      throw new Error('Must supply an SDK');
    }

    this._sdk = sdk;
  }

  redirectToFluxLogin(replace) {
    // We clear up local storage in case there's a lingering user in there.
    clear();

    const state = generateToken();
    const nonce = generateToken();

    store(STATE_KEY, state);
    store(NONCE_KEY, nonce);

    const url = this._sdk.getAuthorizeUrl(state, nonce);

    // We need to assign and call the redirect function like this, or the browser
    // may throw an error due to special window.location behaviour.
    const redirect = replace ? 'replace' : 'assign';
    window.location[redirect](url);
  }

  storeFluxUser(redirectUrl) {
    let promise = null;

    if (!isLoggingIn()) {
      promise = Promise.resolve();
    } else {
      const state = retrieve(STATE_KEY);
      const nonce = retrieve(NONCE_KEY);

      const url = redirectUrl || window.location.href.replace(window.location.hash, '');

      if (!state) {
        throw new Error('No `state` stored');
      } else if (!nonce) {
        throw new Error('No `nonce` stored');
      }

      promise = this._sdk.exchangeCredentials(state, nonce)
        .then(credentials => {
          // We clear here to get rid of the now-unneeded `state` and `nonce` values,
          // as well as anything else that might be lingering in storage.
          clear();

          store(CREDENTIALS_KEY, credentials);
        })
        .then(() => {
          window.history.replaceState({}, document.title, url)
        });
    }

    return promise;
  }

  isLoggedIn() {
    const credentials = retrieve(CREDENTIALS_KEY);

    return this._sdk.User.isLoggedIn(credentials)
      .then(loggedIn => {
        if (!loggedIn) {
          // We clear the credentials key in case invalid (e.g., expired) credentials are
          // still in there.
          clear(CREDENTIALS_KEY);
        }

        return loggedIn;
      });
  }

  logout() {
    // So long and thanks for all the fish!
    clear();
  }

  getUser() {
    const credentials = retrieve(CREDENTIALS_KEY);

    if (!credentials) {
      throw new Error('Cannot get current user: No user credentials stored');
    }

    return this._sdk.getUser(credentials);
  }

  /* eslint-disable consistent-return */
  login(redirectUrl, replace) {
    if (!isLoggingIn()) {
      // We don't return anything here because the user is synchronously redirected,
      // interrupting the current browser execution.
      this.redirectToFluxLogin(replace);
    } else {
      return this.storeFluxUser(redirectUrl, replace);
    }
  }
  /* eslint-enable consistent-return */
}

export default FluxHelpers;
