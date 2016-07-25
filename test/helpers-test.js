import expect, { spyOn, restoreSpies } from 'expect';
import { changeURL } from 'jsdom';

import createTestWindow from './create-test-window';

import FluxHelpers from '../src/helpers';
import * as storage from '../src/storage';
import * as generateTokenModule from '../src/generate-token';

describe('FluxHelpers', function() {
  beforeEach(function() {
    global.window = createTestWindow();

    // We can't import the SDK until the window has been mocked.
    const FluxSdk = require('flux-sdk-browser');

    this.sdk = new FluxSdk('FAKE_CLIENT_ID');
    this.helpers = new FluxHelpers(this.sdk);

    spyOn(generateTokenModule, 'default').andReturn('FAKE_TOKEN');
  });

  afterEach(function() {
    global.window = null;

    restoreSpies();
  });

  describe('#constructor', function() {
    describe('without an SDK', function() {
      it('should throw an error', function() {
        expect(() => { new FluxHelpers(); }).toThrow('Must supply an SDK');
      });
    });
  });

  describe('#redirectToFluxLogin', function() {
    beforeEach(function() {
      let tokenCount = 0;

      storage.store('credentials', 'SHOULD BE CLEARED');
      storage.store('state', 'SHOULD BE CLEARED');

      // We don't actually care about the order in which the state and nonce tokens are generated,
      // but we need to make sure that they're distinct tokens.
      generateTokenModule.default.andCall(() => `FAKE_TOKEN${tokenCount++}`);

      spyOn(this.sdk, 'getAuthorizeUrl').andReturn('https://flux.io/example');
      spyOn(window.location, 'replace');
      spyOn(window.location, 'assign');
    });

    it('should clear the existing storage and store new state and nonce tokens', function() {
      this.helpers.redirectToFluxLogin();

      expect(storage.retrieve()).toEqual({
        state: 'FAKE_TOKEN0',
        nonce: 'FAKE_TOKEN1',
      });
    });

    it('should use the state and nonce to generate the authorize URL', function() {
      this.helpers.redirectToFluxLogin();

      expect(this.sdk.getAuthorizeUrl).toHaveBeenCalledWith('FAKE_TOKEN0', 'FAKE_TOKEN1');
    });

    describe('when replacing the current location history', function() {
      it('should replace the current location with the authorize URL', function() {
        this.helpers.redirectToFluxLogin(true);

        expect(window.location.assign).toNotHaveBeenCalled();
        expect(window.location.replace).toHaveBeenCalledWith('https://flux.io/example');
      });
    });

    describe('when not replacing the current location history', function() {
      it('should assign the current location the authorize URL', function() {
        this.helpers.redirectToFluxLogin();

        expect(window.location.replace).toNotHaveBeenCalled();
        expect(window.location.assign).toHaveBeenCalledWith('https://flux.io/example');
      });
    });
  });

  describe('#storeFluxUser', function() {
    beforeEach(function() {
      const exchangeCredentialsPromise = Promise.resolve({ foo: 'FAKE CREDENTIALS' });

      spyOn(this.sdk, 'exchangeCredentials').andReturn(exchangeCredentialsPromise);
      spyOn(window.location, 'replace');
      spyOn(window.location, 'assign');
    });

    describe('when there is no access token in the URL anchor', function() {
      beforeEach(function() {
        changeURL(global.window, 'https://example.com');
      });

      it('should return a promise', function(done) {
        this.helpers.storeFluxUser()
          .then(done);
      });

      it('should not try to exchange the credentials or redirect', function(done) {
        this.helpers.storeFluxUser()
          .then(() => {
            expect(this.sdk.exchangeCredentials).toNotHaveBeenCalled();
            expect(window.location.replace).toNotHaveBeenCalled();
            expect(window.location.assign).toNotHaveBeenCalled();
          })
          .then(done);
      });
    });

    describe('when there is an access token in the URL anchor', function() {
      beforeEach(function() {
        changeURL(global.window, 'https://example.com/foo#access_token=fake_access_token');
      });

      describe('when there is no state stored', function() {
        beforeEach(function() {
          window.localStorage.setItem('__FLUX__', null);
        });

        it('should throw an error', function() {
          expect(() => {
            this.helpers.storeFluxUser();
          }).toThrow('No `state` stored');
        });
      });

      describe('when there is no nonce stored', function() {
        beforeEach(function() {
          storage.store('state', 'FAKE_STATE');
        });

        it('should throw an error', function() {
          expect(() => {
            this.helpers.storeFluxUser();
          }).toThrow('No `nonce` stored');
        });
      });

      describe('when both the state and nonce are stored', function() {
        beforeEach(function() {
          storage.store('state', 'FAKE_STATE');
          storage.store('nonce', 'FAKE_NONCE');
        });

        it('should exchange them for credentials', function() {
          this.helpers.storeFluxUser();

          expect(this.sdk.exchangeCredentials).toHaveBeenCalledWith('FAKE_STATE', 'FAKE_NONCE');
        });

        it('should clear the Flux storage and store the credentials', function(done) {
          this.helpers.storeFluxUser()
            .then(() => {
              expect(window.localStorage.getItem('__FLUX__')).toEqual(JSON.stringify({
                credentials: { foo: 'FAKE CREDENTIALS' },
              }));
            })
            .then(done);
        });

        describe('when replacing the location history', function(done) {
          it('should replace the current location with the redirect URL', function() {
            this.helpers.storeFluxUser('https://example.com/somewhere', true)
              .then(() => {
                expect(window.location.assign).toNotHaveBeenCalled();
                expect(window.location.replace).toHaveBeenCalledWith('https://example.com/somewhere');
              })
              .then(done);
          });
        });

        describe('when not replacing the location history', function(done) {
          it('should assign the current location the redirect URL', function() {
            this.helpers.storeFluxUser('https://example.com/somewhere')
              .then(() => {
                expect(window.location.replace).toNotHaveBeenCalled();
                expect(window.location.assign).toHaveBeenCalledWith('https://example.com/somewhere');
              })
              .then(done);
          });
        });

        describe('when there is no redirect URL specified', function() {
          beforeEach(function() {
            changeURL(global.window, 'https://example.com/foo#access_token=fake_access_token');
          });

          it('should redirect the user to a cleaned-up version of the current URL', function(done) {
            this.helpers.storeFluxUser()
              .then(() => {
                expect(window.location.assign).toHaveBeenCalledWith('https://example.com/foo');
              })
              .then(done);
          });
        });
      });
    });
  });

  describe('#isLoggedIn', function() {
    describe('when there is no user stored', function() {
      beforeEach(function() {
        window.localStorage.setItem('__FLUX__', null);

        spyOn(this.sdk.User, 'isLoggedIn').andReturn(Promise.resolve(false));
      });

      it('should resolve to false', function(done) {
        this.helpers.isLoggedIn()
          .then(isLoggedIn => {
            expect(isLoggedIn).toEqual(false);
          })
          .then(done);
      });
    });

    describe('when there is an invalid user', function() {
      beforeEach(function() {
        storage.store('credentials', 'INVALID_CREDENTIALS');

        spyOn(this.sdk.User, 'isLoggedIn').andReturn(Promise.resolve(false));
      });

      it('should remove the invalid user and resolve to false', function(done) {
        this.helpers.isLoggedIn()
          .then(isLoggedIn => {
            expect(this.sdk.User.isLoggedIn).toHaveBeenCalledWith('INVALID_CREDENTIALS');

            expect(storage.retrieve('credentials')).toBeFalsy();

            expect(isLoggedIn).toEqual(false);
          })
          .then(done);
      });
    });

    describe('when there is a valid user', function() {
      beforeEach(function() {
        storage.store('credentials', 'VALID_CREDENTIALS');

        spyOn(this.sdk.User, 'isLoggedIn').andReturn(Promise.resolve(true));
      });

      it('should remove the invalid user and resolve to false', function(done) {
        this.helpers.isLoggedIn()
          .then(isLoggedIn => {
            expect(this.sdk.User.isLoggedIn).toHaveBeenCalledWith('VALID_CREDENTIALS');

            expect(storage.retrieve('credentials')).toEqual('VALID_CREDENTIALS');

            expect(isLoggedIn).toEqual(true);
          })
          .then(done);
      });
    });
  });

  describe('#logout', function() {
    beforeEach(function() {
      spyOn(storage, 'clear');
    });

    it('should clear the current user from storage', function() {
      this.helpers.logout();

      expect(storage.clear).toHaveBeenCalled();
    });
  });

  describe('#getUser', function() {
    describe('with no stored credentials', function() {
      beforeEach(function() {
        spyOn(storage, 'retrieve').andReturn(null);
      });

      it('should throw an error', function() {
        expect(() => { this.helpers.getUser(); })
          .toThrow('Cannot get current user: No user credentials stored');
      });
    });

    describe('with stored credentials', function() {
      beforeEach(function() {
        this.fakeUser = { something: 'FAKE USER' };

        spyOn(storage, 'retrieve').andCall(key => {
          let value = null;

          if (key === 'credentials') {
            value = { foo: 'FAKE CREDENTIALS' };
          }

          return value;
        });

        spyOn(this.sdk, 'getUser').andReturn(this.fakeUser);
      });

      it('should return a user for those credentials', function() {
        const user = this.helpers.getUser();

        expect(this.sdk.getUser).toHaveBeenCalledWith({ foo: 'FAKE CREDENTIALS' });

        expect(user).toBe(this.fakeUser);
      });
    });
  });

  describe('#login', function() {
    beforeEach(function() {
      spyOn(window.location, 'assign');
      spyOn(window.location, 'replace');

      spyOn(this.sdk, 'getAuthorizeUrl').andReturn('https://flux.io/example');
      spyOn(this.sdk, 'exchangeCredentials').andReturn(Promise.resolve({ foo: 'FAKE CREDENTIALS' }));
    });

    describe('when there is no access token in the URL', function() {
      beforeEach(function() {
        changeURL(global.window, 'https://example.com/foo');
      });

      describe('when replacing the location', function() {
        it('should replace the location with the authorization URL', function() {
          this.helpers.login('https://example.com/redirect', true);

          expect(window.location.replace).toHaveBeenCalledWith('https://flux.io/example');
        });
      });

      describe('when not replacing the location', function() {
        it('should assign the location the authorization URL', function() {
          this.helpers.login('https://example.com/redirect', false);

          expect(window.location.assign).toHaveBeenCalledWith('https://flux.io/example');
        });
      });
    });

    describe('when there is an access token in the URL', function() {
      beforeEach(function() {
        changeURL(global.window, 'https://example.com/foo#access_token=fake_access_token');

        storage.store('state', 'FAKE_STATE');
        storage.store('nonce', 'FAKE_NONCE');
      });

      it('should retrieve and store the credentials', function(done) {
        this.helpers.login('https://example.com/redirect')
          .then(() => {
            expect(storage.retrieve('credentials')).toEqual({
              foo: 'FAKE CREDENTIALS',
            });
          })
          .then(done);
      });

      describe('when replacing the location', function() {
        it('should replace the location with the specified URL', function(done) {
          this.helpers.login('https://example.com/redirect', true)
            .then(() => {
              expect(window.location.replace).toHaveBeenCalledWith('https://example.com/redirect');
            })
            .then(done);
        });
      });

      describe('when not replacing the location', function() {
        it('should assign the location the specified URL', function(done) {
          this.helpers.login('https://example.com/redirect')
            .then(() => {
              expect(window.location.assign).toHaveBeenCalledWith('https://example.com/redirect');
            })
            .then(done);
        });
      });

      describe('with no redirect URL specified', function() {
        beforeEach(function() {
          changeURL(global.window, 'https://example.com/foo#access_token=fake_access_token');
        });

        it('should redirect the user to a cleaned-up version of the current URL', function(done) {
          this.helpers.login()
            .then(() => {
              expect(window.location.assign).toHaveBeenCalledWith('https://example.com/foo');
            })
            .then(done);
        });
      });
    });
  });
});
