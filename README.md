# Flux SDK Helpers

Helper functions for the Flux Browser SDK.

* <a href="#setup">Setup</a>
* <a href="#example">Example</a>
* <a href="#api">API</a>

**Notes:**

* These functions do not add any additional functionality. They're meant only to simplify some
common patterns, particularly around authentication.
* These helpers are only compatible with the **browser** version.
* FluxHelpers makes some lightweight usage of `window.localStorage`. We namespace everything
under `__FLUX__`. (This may change in future version)

## <a id="setup"></a>Setup

### Standard

In your HTML:

```html
<script src="https://unpkg.com/flux-sdk-browser@<sdk version>/dist/flux-sdk-min.js"></script>
<script src="https://unpkg.com/flux-sdk-helpers@0.1/dist/flux-sdk-helpers.js"></script>
```

In your JavaScript:

```js
var sdk = new FluxSdk(clientId, {
  redirectUri: 'https://example.com/auth'
});
var helpers = new FluxHelpers(sdk);
```

### Advanced

1. `npm install --save flux-sdk-helpers`
2. Import into your code:

  ```js
  // ES6
  import FluxHelpers from 'flux-sdk-helpers';
  import FluxSdk from 'flux-sdk-browser';

  // CommonJS
  var FluxSdk = require('flux-sdk-browser');
  var FluxHelpers = require('flux-sdk-helpers');
  
  var sdk = new FluxSdk('YOUR_CLIENT_ID', {
    redirectUri: 'https://example.com/auth'
  });
  var helpers = new FluxHelpers(sdk);
  ```

## <a id="example"></a>Example

```js
var sdk = new FluxSdk('YOUR_CLIENT_ID', { redirectUri: 'https://example.com/authorize' });
var helpers = new FluxHelpers(sdk);

let user = null;

function initializeUser() {
  return helpers.isLoggedIn()
    .then(function(isLoggedIn) {
      if (isLoggedIn) {
        user = helpers.getUser();
      } else {
        return helpers.login();
      }
    });
}

function initializeApp() {
  // Your app is ready to go! :)
  user.fetchProfile()
    .then(function(profile) {
      console.log(profile);
    });
}

// Because the authentication process is asynchronous,
// make sure that you wait until the user has been authenticated
// before you perform any logic that depends on the user being set!
initializeUser().then(initializeApp);
```

## <a id="api"></a>API

### constructor: `FluxHelpers(sdk)`

#### Arguments

1. `sdk` *(FluxSdk instance)*: An instance of the
[Flux Browser SDK](https://www.npmjs.com/package/flux-sdk-browser)].

**NOTE:** FluxHelpers assumes that you have instantiated the SDK with your redirect URI,
i.e., via `new FluxSdk(clientId, { redirectUri: redirectUri })` where `clientId` and
`redirectUri` are your app's client ID and redirect URI.

### <a id="login"></a>`login(redirectUrl, replace)`

This authenticates and stores a user. It is a shortcut that combines
[`redirectToFluxLogin`](#redirecttofluxlogin) and [`storeFluxUser`](#storefluxuser).

#### Arguments

1. `redirectUrl?` *(String)*: The location that you want your user to go to once they have been
authenticated. If not supplied, this will simply redirect the user to a cleaned-up version of their
current location that does not contain authentication-related values.
1. `replace` *(Boolean)*: If true, the current location's spot in your user's history will be
overwritten by Flux: they will not be able to return to it by pressing "back." See
[Location.replace](https://developer.mozilla.org/en-US/docs/Web/API/Location/replace) vs
[Location.assign](https://developer.mozilla.org/en-US/docs/Web/API/Location/assign) for details.

#### Return Value

For the first login step, [`redirectToFluxLogin`](#redirecttofluxlogin), it will return nothing as
the user gets redirected.

For the second login step, [`storeFluxUser`](#storefluxuser), it will return the same empty
promise as `storeFluxUser`.

### <a id="getuser"></a>`getUser`

This returns the current user, using whatever credentials are currently stored.

#### Return Value

*[User](https://flux.gitbooks.io/flux-javascript-sdk/content/docs/api/User.html)*: A Flux User
instance, all set for you to go.

### <a id="logout"></a>`logout`

This removes the currently stored user.

### <a id="redirecttofluxlogin"></a>`redirectToFluxLogin(replace)`

`redirectToFluxLogin` sends a user to Flux for authentication. Upon authorizing your app, they will
be redirected back to your app.

#### Arguments

1. `replace` *(Boolean)*: If true, the current location's spot in your user's history will be
overwritten by Flux: they will not be able to return to it by pressing "back." See
[Location.replace](https://developer.mozilla.org/en-US/docs/Web/API/Location/replace) vs
[Location.assign](https://developer.mozilla.org/en-US/docs/Web/API/Location/assign) for details.

### <a id="storefluxuser"></a>`storeFluxUser(redirectUrl, replace)`

If the user has just **been redirected from authenticating on Flux**, their credentials will be
stored in the browser will be redirected to wherever you want them to go next.

**Otherwise**, `storeFluxUser` will resolve to an empty promise and you can continue loading your
app.

#### Arguments

1. `redirectUrl?` *(String)*: The location that you want your user to go to once they have been
authenticated. If not supplied, this will simply redirect the user to a cleaned-up version of their
current location that does not contain authentication-related values.
1. `replace` *(Boolean)*: If true, the current location's spot in your user's history will be
overwritten by Flux: they will not be able to return to it by pressing "back." See
[Location.replace](https://developer.mozilla.org/en-US/docs/Web/API/Location/replace) vs
[Location.assign](https://developer.mozilla.org/en-US/docs/Web/API/Location/assign) for details.

#### Return Value

*Promise --> null* `storeFluxUser` will always resolve to a Promise. You should use this to catch
authentication errors (e.g., from an invalid client ID) and to continue your app's initialization
logic if the user was not just redirected from authenticating on Flux.

