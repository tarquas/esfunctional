'use strict';

// es6 functional helpers globals

/**
 * @callback SpawnGenerator
 * @description A generator function, which uses `yield` to wait for Promise-returning functions
 *    to use async in sync code.
 * @param {*} arg Optional argument, which may be passed from outside via `spawn`.
 * @returns {*} A value, which becomes a result of Promise after `spawn` wrapper.
 */

/**
 * @callback PromiseCallback
 * @description A callback, called by Promise resolver or rejecter.
 * @param {*} value A value, which is passed as a result of previous resolved Promise with `.then`
 *    or an error of rejected Promise with `.catch`.
 * @returns {Promise|*} A promise to wait for or a result value if it's ready.
 */

/**
 * @name _
 * @description Lodash shortcut.
 * @mixin
 */
global._ = require('lodash');

/**
 * @function ok
 * @description Returns generic value resolving promise.
 * @param {*} data A value to resolve with
 * @returns {Promise}
 */
global.ok = (data) => new Promise((resolve) => resolve(data));

/**
 * @function nok
 * @description Returns generic error rejecting promise.
 * @param {*} err An error to reject with
 * @returns {Promise}
 */
global.nok = (err) => new Promise((resolve, reject) => reject(err));

/**
 * @function unbind
 * @description Declare function `targetFunction` with first arg treated as `this` and other args shifted left.
 * @param {Function} targetFunction A function to convert.
 * @returns {Function}
 */
global.unbind = (targetFunction) => function() {
  return targetFunction.apply(this, [this].concat([].slice.call(arguments)));
};

/**
 * @function oknok
 * @description Used in converting callback into a Promise.
 * @param {Function} resolve - A `resolve` parameter from new Promise(...)
 * @param {Function} reject - A `reject` parameter from new Promise(...)
 */
global.oknok = (resolve, reject) => (err, data) => (err) ? reject(err) : resolve(data);

/**
 * @name catchify
 * @description Convert old-style Promise of `.then(ok, nok)` to new-style `.then(ok).catch(nok)`.
 *    Use `oldPromise [catchify] ()`.
 * @type {Symbol}
 */
global.catchify = Symbol('catchify');

Object.prototype[global.catchify] = global.unbind((theny) => (
  (theny[global.syncFail]) ? theny :
  new Promise((ok, nok) => theny.then(ok, nok))
));

/**
 * @name nulla
 * @description A value of `null` as object for `then`.
 * @type {Object}
 */
global.nulla = {};

/**
 * @name undefineda
 * @description A value of `undefined` as object for `then`.
 * @type {Object}
 */
global.undefineda = {};

/**
 * @function vala
 * @description Wrap a value to `then`-compatible form (special `null` and `undefined`).
 * @param {*} value A value to wrap. Can be of any type, including `null` and `undefined`.
 * @returns {*} A wrapped value is the same unless it's `null` or `undefined`,
 *    which get converted to special objects.
 */
global.vala = (value) => (
  value === undefined ? global.undefineda :
  value === null ? global.nulla :
  value
);

let call = function(callback) {

  // jshint maxcomplexity: 8

  var v;
  try {
    return (callback == null) ? this : (typeof callback === 'function') ? (
      v = (
        this === global.undefineda ? callback() :
        this === global.nulla ? callback(null) :
        callback(this)
      ),

      v === undefined ? this :
      v === null ? global.nulla :
      v
    ) : callback;
  } catch (err) {
    err[global.syncFail] = true;
    return err;
  }
};

/**
 * @name syncFail
 * @description Object having this symbol will be treated as failure error object.
 * @type {Symbol}
 */
global.syncFail = Symbol('syncFail');

/**
 * @name then
 * @description Pass an non-error object (with no `syncFail` symbol) to a callback. Error object is returned as-is.
 * @type {Symbol}
 */
global.then = Symbol('then');

Object.prototype[global.then] = function(callback) {
  if (this[global.syncFail]) return this;
  return call.call(this, callback);
};

/**
 * @name fail
 * @description Pass an error object (with `syncFail` symbol) to a callback. Non-error object is returned as-is.
 * @type {Symbol}
 */
global.fail = Symbol('fail');

Object.prototype[global.fail] = function(callback) {
  if (!this[global.syncFail]) return this;
  return call.call(this, callback);
};

/**
 * @name thens
 * @description Same as `then` but make a failure asynchronous.
 * @type {Symbol}
 */
global.thens = Symbol('thens');

Object.prototype[global.thens] = global.unbind((value, callback) => (
  value[global.syncFail] ? value :
  (value) [global.then] (callback) [global.fail] (
    (err) => global.nok(err) [global.then] ((promise) => (
      promise[global.syncFail] = true,
      promise
    ))
  )
));

/**
 * @name thena
 * @description Unified `then`. Works both for sync and async results.
 * @type {Symbol}
 */
global.thena = Symbol('thena');

Object.prototype[global.thena] = global.unbind((value, callback) => (
  (value instanceof Promise) ? value.then(callback) :
  value [global.thens] (callback)
));

/**
 * @name catcha
 * @description Unified `catch`/`fail`. Works both for sync and async results.
 * @type {Symbol}
 */
global.catcha = Symbol('catcha');

Object.prototype[global.catcha] = global.unbind((value, callback) => (
  (value instanceof Promise) ? value.catch(callback) :
  value [global.fail] (callback)
));

// lodash globalizer
/**
 * @name _any_lodash_function_
 * @description Object-based lodash globalization.
 *    F.x. object [forEach] (callback) is the same as _.forEach(object, callback).
 * @type {Symbol}
 */
global._.forOwn(global._, (f, k) => (typeof f === 'function' && !global[k]) ? (

  Object.prototype[global[k] = Symbol(k)] = function() {
    if (this[global.syncFail]) return this;
    return f.apply(global._, [this].concat([].slice.call(arguments)));
  },

  Object.prototype[global[k + 'Array'] = Symbol(k + 'Array')] = function() {
    if (this[global.syncFail]) return this;
    return f.apply(global._, this.concat([].slice.call(arguments)));
  }

) : true);

/**
 * @name iterate
 * @description Async `foreach` with ability to break, jump and custom result collection.
 * @type {Symbol}
 */
global.iterate = Symbol('iterate');

Object.prototype[global.iterate] = global.unbind((object, iterator) => (
  (object[global.syncFail]) ? object :

  ({
    isArray: object instanceof Array,
    array: object instanceof Array ? object : Object.keys(object)
  })

  [global.thens] ((q) => (
    q.results = q.isArray ? [] : {},

    (0) [global.thens] (q.outerIterator = (index) => (
      (index >= q.array.length) ? q.results :

      (q.isArray ? index : q.array[index])

      [global.thens] ((key) => (
        false [global.thens] (object[key])

        [global.thens] ((value) => iterator(value, key, object, index))

        [global.then] ((cmd) => ((cmd instanceof Promise) && (q.isAsync = true), undefined))

        [global.thena] ((cmd) => (

          // jshint maxcomplexity: 10

          (cmd === false) ? q.results :

          (typeof cmd === 'number') ? q.outerIterator(cmd) :

          (!q.isArray && typeof cmd === 'string') ? (
            q.array.indexOf(cmd)

            [global.thens] ((keyIndex) => keyIndex < 0 ? q.results : q.outerIterator(keyIndex))
          ) :

          (
            (cmd != null && typeof cmd === 'object') && (
              (cmd instanceof Array) ? (
                q.isArray ? q.results.push.apply(q.results, cmd) :

                q.results[key] = cmd[0]
              ) :

              q.isArray ? q.results.push.apply(q.results, cmd [global.values] ()) :

              q.results [global.extend] (cmd)
            ),

            q.outerIterator(index + 1)
          )
        ))
      ))
    ))

    [global.thens] ((result) => (q.isAsync ? global.ok(result) : result))
  ))
));

// yield support

/**
 * @function spawn
 * @description ES6 yield a Promise.
 * @param {SpawnGenerator} generatorFunc A generator, which may use `yield` to wait for
 *    Promise-returning function and get its value.
 * @param {*} arg An argument passed to `generatorFunc`.
 * @returns {PromiseCallback} A Promise-returning function. Promise receives a value, returned by `generatorFunc`.
 */
global.spawn = function(generatorFunc, arg) {
  function continuer(verb, arg) {
    var result;
    try {
      result = generator[verb](arg);
    } catch (err) {
      return Promise.reject(err);
    }

    if (result.done) {
      return result.value;
    } else {
      return Promise.resolve(result.value).then(onFulfilled, onRejected);
    }
  }

  var generator = generatorFunc(arg);
  var onFulfilled = continuer.bind(continuer, 'next');
  var onRejected = continuer.bind(continuer, 'throw');
  return onFulfilled();
};

/**
 * @function delay
 * @description Get a Promise, which is resolved after given wait time.
 * @param {Number} msec Milliseconds to wait.
 * @returns {Promise} Promise which is resolved.
 */
global.delay = (msec) => new Promise((ok) => setTimeout(ok, msec));
