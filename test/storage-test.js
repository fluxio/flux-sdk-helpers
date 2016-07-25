import expect from 'expect';

import createTestWindow from './create-test-window';

import { retrieve, store, clear } from '../src/storage';

describe('storage', function() {
  beforeEach(function() {
    global.window = createTestWindow();
  });

  afterEach(function() {
    global.window = undefined;
  });

  describe('#retrieve', function() {
    describe('without a key', function() {
      describe('when there is nothing stored for Flux', function() {
        it('should return an empty object', function() {
          expect(retrieve()).toEqual({});
        });
      });

      describe('when there is something stored for Flux', function() {
        beforeEach(function() {
          const storedValue = JSON.stringify({
            foo: 'bar',
            bar: 'baz',
          });

          window.localStorage.setItem('__FLUX__', storedValue);
        });

        it('should return the JSON-parsed value', function() {
          expect(retrieve()).toEqual({
            foo: 'bar',
            bar: 'baz',
          });
        });
      });
    });

    describe('with a key', function() {
      describe('when there is nothing stored at all for Flux', function() {
        it('should return null', function() {
          expect(retrieve('foo')).toEqual(null);
        });
      });

      describe('when there is nothing stored for the relevant key', function() {
        beforeEach(function() {
          const storedValue = JSON.stringify({ foo: 'bar' });

          window.localStorage.setItem('__FLUX__', storedValue);
        });

        it('should return null', function() {
          expect(retrieve('baz')).toEqual(null);
        });
      });

      describe('when there is something for that value', function() {
        beforeEach(function() {
          const storedValue = JSON.stringify({
            foo: { a: 'b' },
            bar: 'baz',
          });

          window.localStorage.setItem('__FLUX__', storedValue);
        });

        it('should return the JSON-parsed value', function() {
          expect(retrieve('foo')).toEqual({ a: 'b' });
        });
      });
    });
  });

  describe('#store', function() {
    describe('when there is nothing stored for Flux', function() {
      it('should store the new JSON-stringified key-value pair', function() {
        store('foo', { a: 'b' });

        const stored = window.localStorage.getItem('__FLUX__');

        expect(JSON.parse(stored)).toEqual({
          foo: { a: 'b' },
        });
      });
    });

    describe('when there is something stored for Flux', function() {
      beforeEach(function() {
        const stored = JSON.stringify({ foo: 'bar' });

        window.localStorage.setItem('__FLUX__', stored);
      });

      it('should add the new JSON-stringified key-value pair', function() {
        store('something', { a: 'b' });

        const stored = window.localStorage.getItem('__FLUX__');

        expect(JSON.parse(stored)).toEqual({
          foo: 'bar',
          something: { a: 'b' },
        });
      });
    });

    describe('when there is already something stored for that key', function() {
      beforeEach(function() {
        const stored = JSON.stringify({ foo: 'bar' });

        window.localStorage.setItem('__FLUX__', stored);
      });

      it('should overwrite the existing value', function() {
        store('foo', 'new value');

        const stored = window.localStorage.getItem('__FLUX__');

        expect(JSON.parse(stored)).toEqual({ foo: 'new value' });
      });
    });
  });

  describe('#clear', function() {
    describe('without a key', function() {
      describe('when there is nothing stored for Flux', function() {
        it('should do nothing', function() {
          clear();

          expect(window.localStorage.getItem('__FLUX__')).toEqual(null);
        });
      });

      describe('when there is something stored for Flux', function() {
        beforeEach(function() {
          const stored = JSON.stringify({ foo: 'bar' });
          window.localStorage.setItem('__FLUX__', stored);
        });

        it('should clear the value', function() {
          clear();

          expect(window.localStorage.getItem('__FLUX__')).toEqual(null);
        });
      });
    });

    describe('with a key', function() {
      describe('when there is nothing stored for Flux', function() {
        it('should do nothing', function() {
          clear('foo');

          expect(window.localStorage.getItem('__FLUX__')).toEqual(null);
        });
      });

      describe('when there is something stored for Flux', function() {
        beforeEach(function() {
          const stored = JSON.stringify({
            foo: 'bar',
            bar: 'baz',
          });

          window.localStorage.setItem('__FLUX__', stored);
        });

        it('should clear only the value', function() {
          clear('foo');

          expect(window.localStorage.getItem('__FLUX__')).toEqual(JSON.stringify({
            bar: 'baz',
          }));
        });
      });
    });
  });
});
