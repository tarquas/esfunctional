'use strict';

// es6 functional helpers globals

let version = 1.1004;

if (global.esfunctional && version <= global.esfunctional) {
  module.exports = global.esfunctionalClass;
  return;
}

if (global.esfunctionalClass) module.exports = global.esfunctionalClass;
else global.esfunctionalClass = module.exports;

if (!global.esfunctionalFinalizers) global.esfunctionalFinalizers = [];

global.esfunctional = version;

let S = module.exports;

let P = Object.prototype;
global.ensureSymbol = (name) => global[name] || (global[name] = Symbol(name));

global.chalk = require('chalk');
global.lodash = require('lodash');
global.PrettyError = require('pretty-error');
global.prettyError = new PrettyError();

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
global._ = lodash;

global.isPromise = (obj) => (
  obj &&
  obj.then &&
  obj.catch &&
  obj.constructor &&
  obj.constructor.name !== 'Object'
);

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
global.oknok = (resolve, reject) => (err, data) => (err) ? setImmediate(reject, err) : setImmediate(resolve, data);

/**
 * @name stub
 * @description Empty function.
 * @type Symbol
 */
global.stub = () => {};

P[ensureSymbol('spawnact')] = function(args) {
  let iter = this;
  if (!iter) return Promise.resolve(iter);

  if (typeof iter === 'function') {
    if (iter [get]('constructor.name', 0) === 'GeneratorFunction') {
      return iter.apply(iter, arguments) [pro](this && this[status]);
    }

    return Promise.resolve(iter.apply(iter, arguments));
  }

  if (iter [get]('constructor.constructor.name', 0) === 'GeneratorFunction') {
    //return iter [pro](this && this[status]);
    throw 'notSupported';
  }

  return isPromise(iter) ? iter : Promise.resolve(iter);
};

let persistentRace = (promises) => {
  let race = Promise.defer();
  let todo = promises.length;
  let failed = {};
  let result = false;

  promises.forEach((promise, promiseIdx) => {
    if (promise) promise [thena]((data) => {
      if (!result) {
        result = true;
        race.resolve(data);

        promises.forEach((elem, idx) => {
          if (idx !== promiseIdx && !(idx in failed) && elem[halt]) elem[halt](msg);
        });
      }
    })

    [catcha]((err) => {
      if (!result) {
        if (--todo) return;
        result = true;
        race.reject(err);
      } else {
        failed[promiseIdx] = true;
      }
    })
  });

  race.promise[halt] = (msg) => {
    if (!result) promises.forEach((elem, idx) => {
      if (!(idx in failed) && elem[halt]) elem[halt](msg);
    });
  };

  return race.promise;
};

ensureSymbol('status');
ensureSymbol('halt');
ensureSymbol('current');

/**
 * @name all
 * @description Promise.all of left with halt and object mapping support.
 * @param {Object} chunk Funnel options: {size: Count, delay: Msec, timeout: Msec, timeoutMsg: String}.
 * @type Symbol
 */


P[ensureSymbol('all')] = unbind((inputs, chunk) => spawn(function*(arg) {
  let mapping = inputs instanceof Array ? null : inputs [map]((v, k) => ({key: k, value: v}));
  let actions = mapping ? mapping.map(item => item.value) : inputs;
  let statuses = mapping ? {} : [];
  arg [status][all] = statuses;
  let result;

  if (!chunk) chunk = {};
  let chunkSize = chunk.size | 0;

  if (chunkSize > 0) {
    result = [];

    for (let i = 0; i < actions.length; i += chunkSize) {
      if (i && chunk.delay) yield delay(chunk.delay);
      let slice = actions.slice(i, i + chunkSize);
      let promises = slice.map(act => act [spawnact].apply(act, chunk.args));
      promises [forEach]((promise, j) => {statuses[mapping ? mapping[i + j].key : i + j] = promise[status];});
      let promise = chunk.race ? persistentRace(promises) : Promise.all(promises);
      if (!promise[halt]) promise[halt] = (msg) => {slice.forEach(elem => {if (elem[halt]) elem[halt](msg);});};
      let chunkResult;

      try {
        chunkResult = yield promise [timeout](chunk.timeout, chunk.timeoutMsg);
        if (chunk.race) {result = chunkResult; break;}
      } catch (err) {
        if (!chunk.race) throw err;
        if (i + chunkSize >= actions.length) throw err;
      }

      result.push.apply(result, chunkResult);
    }
  } else {
    let promises = actions.map(act => act [spawnact].apply(act, chunk.args));
    promises [forEach]((promise, j) => {statuses[mapping ? mapping[j].key : j] = promise[status];});
    let promise = chunk.race ? persistentRace(promises) : Promise.all(promises);
    if (!promise[halt]) promise[halt] = (msg) => {promises.forEach(elem => {if (elem[halt]) elem[halt](msg);});};
    result = yield promise;
  }

  return mapping && !chunk.race ? result [mapKeys]((v, k) => mapping[k].key) : result;
}));

/**
 * @name timeout
 * @description Time out a promise.
 * @type Symbol
 */


P[ensureSymbol('timeout')] = function(msec, customMsg) {
  if (!msec) return this;
  let error = (customMsg || 'timeout') [errstack](1);

  let promise = Promise.race([this, new Promise((ok, nok) => (
    setTimeout(() => nok(error), msec)
  ))]);

  promise[halt] = this[halt];
  promise[status] = this[status];
  return promise;
};

/**
 * @name index
 * @description Get dictionary of indexes from array or single entry.
 * @type Symbol
 */
global.index = (ent) => !ent ? {} : (ent instanceof Array ? ent : [ent]) [invert]();

/**
 * @name promisify
 * @description Call callback-based method of object as Promise-based.
 * @type Symbol
 */


P[ensureSymbol('promisify')] = unbind((object, method, opts) => function() {
  //let error = new Error() [errstack](1);
  let args = [].slice.call(arguments);
  if (!opts) opts = {};

  if (!method) {
    method = object;
    object = global;
  }

  let myHalt;
  let promise;

  promise = new Promise((ok, nok) => {
    let func = typeof method === 'function' ? method : object[method];

    myHalt = (msg) => {
      if (opts.haltFunc) opts.haltFunc(object, promise);
      //error.message = msg || 'halted';
      nok(msg || 'halted');
    };

    if (promise) promise[halt] = myHalt;

    func.apply(object, args.concat(oknok(ok, nok)));
  });

  if (myHalt) promise[halt] = myHalt;
  promise[status] = {};

  return promise;
});

/**
 * @name promisifyAll
 * @description Returns a function, accepting method for promisifying given object.
 * @type Symbol
 */


P[ensureSymbol('promisifyAll')] = unbind((tobj) => function(method) {
  let obj = tobj;
  if (!method) return obj;
  if (arguments.length === 1) return obj [promisify](method);
  for (let i = 0; i < arguments.length - 1; i++) obj = obj[arguments[i]];
  return obj [promisify](arguments[arguments.length - 1]);
});

ensureSymbol('syncFail');

/**
 * @name catchify
 * @description Convert old-style Promise of `.then(ok, nok)` to new-style `.then(ok).catch(nok)`.
 *    Use `oldPromise [catchify] ()`.
 * @type {Symbol}
 */


P[ensureSymbol('catchify')] = unbind((theny) => {
  if (theny[syncFail]) return theny;
  let promise = new Promise((ok, nok) => theny.then(ok, nok));
  promise[halt] = theny[halt];
  promise[status] = theny[status];
  return promise;
});

/**
 * @name nulla
 * @description A value of `null` as object for `then`.
 * @type {Object}
 */
global.nulla = {wrapper: 'null'};

/**
 * @name undefineda
 * @description A value of `undefined` as object for `then`.
 * @type {Object}
 */
global.undefineda = {wrapper: 'undefined'};

/**
 * @function vala
 * @description Wrap a value to `then`-compatible form (special `null` and `undefined`).
 * @param {*} value A value to wrap. Can be of any type, including `null` and `undefined`.
 * @returns {*} A wrapped object is the same unless it's `null` or `undefined`,
 *    which get converted to special objects.
 */
global.vala = (value) => (
  value === undefined ? undefineda :
  value === null ? nulla :
  value
);

/**
 * @function obja
 * @description Unwrap a value from `then`-compatible form (get `null` and `undefined` from special).
 * @param {*} object An object to unwrap. For `null` and `undefined` there are special objects.
 * @returns {*} An unwrapped value is the same unless it's special `null` or `undefined` object,
 *    which get converted to corresponding value.
 */
global.obja = (object) => (
  object === undefineda ? undefined :
  object === nulla ? null  :
  object
);

/**
 * @name final
 * @description Convert special value like `nulla` and `undefineda` to `null` and `undefined`.
 * @type Symbol
 */


P[ensureSymbol('final')] = unbind(obj => obja(obj));

let call = function(callback, undef) {

  // jshint maxcomplexity: 8

  var v;
  try {
    return (callback == null) ? this : (typeof callback === 'function') ? (
      v = (
        this === undefineda ? callback() :
        this === nulla ? callback(null) :
        callback(this)
      ),

      v === undefined ? (undef ? undefineda : this) :
      v === null ? nulla :
      v
    ) : callback;
  } catch (err) {
    err[syncFail] = true;
    return err;
  }
};

/**
 * @name syncFail
 * @description Object having this symbol will be treated as failure error object.
 * @type {Symbol}
 */


/**
 * @name then
 * @description Pass an non-error object (with no `syncFail` symbol) to a callback. Error object is returned as-is.
 * @type {Symbol}
 */


P[ensureSymbol('then')] = function(callback, undef) {
  if (this[syncFail]) return this;
  return call.call(this, callback, undef);
};

/**
 * @name fail
 * @description Pass an error object (with `syncFail` symbol) to a callback. Non-error object is returned as-is.
 * @type {Symbol}
 */


P[ensureSymbol('fail')] = function(callback) {
  if (!this[syncFail]) return this;
  return call.call(this, callback);
};

/**
 * @name thens
 * @description Same as `then` but make a failure asynchronous.
 * @type {Symbol}
 */


P[ensureSymbol('thens')] = unbind((value, callback, undef) => (
  value[syncFail] ? value :
  (value) [then] (callback, undef) [fail] (
    (err) => nok(err) [then] ((promise) => (
      promise[syncFail] = true,
      promise
    ))
  )
));

/**
 * @name thena
 * @description Unified `then`. Works both for sync and async results.
 * @type {Symbol}
 */


P[ensureSymbol('thena')] = unbind((value, callback, undef) => (
  isPromise(value) ? value.then(callback) :
  value [thens] (callback, undef)
));

/**
 * @name catcha
 * @description Unified `catch`/`fail`. Works both for sync and async results.
 * @type {Symbol}
 */


P[ensureSymbol('catcha')] = unbind((value, callback) => (
  isPromise(value) ? value.catch(callback || (err => err)) :
  value [fail] (callback)
));

// lodash globalizer
/**
 * @name _any_lodash_function_
 * @description Object-based lodash globalization.
 *    F.x. object [forEach] (callback) is the same as _.forEach(object, callback).
 * @type {Symbol}
 */
_.forOwn(_, (f, k) => (typeof f === 'function' && !global[k]) ? (

  P[ensureSymbol(k)] = function() {
    if (this[syncFail]) return this;
    return vala(f.apply(_, [obja(this)].concat([].slice.call(arguments))));
  },

  P[ensureSymbol(k + 'Array')] = function(firstArg) {
    if (this[syncFail]) return this;

    return vala(f.apply(_, (this instanceof Array ? this : [this]).concat(
      firstArg instanceof Array ? firstArg :
      [].slice.call(arguments)
    )));
  }

) : true);

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
  if (typeof generatorFunc !== 'function') return generatorFunc;

  if (generatorFunc.constructor.name !== 'GeneratorFunction') {
    let value = generatorFunc(arg);
    return value != null ? value : Promise.resolve(value);
  }

  if (!arg) arg = {};

  let flow = generatorFunc(arg);
  return flow [pro](arg);
};

P[ensureSymbol('pro')] = function(arg) {
  let generator = this;

  if (typeof generator === 'function') {
    if (generator [get]('constructor.name', 0) === 'GeneratorFunction') generator = generator();
    else return generator();
  }

  //let error = new Error() [errstack](1);
  let haltTree = false;
  let myStatus = {};
  let spawnRet;

  if (!arg) arg = {};
  arg[status] = myStatus;

  let onFulfilled = (arg) => {
    let ret;

    while (true) {
      if (haltTree) {
        //error.message = haltTree;
        return Promise.reject(haltTree);
      }

      let result;

      try {
        result = generator.next(arg);
      } catch (err) {
        ret = Promise.reject(err);
      }

      if (result) {
        if (result.done) {
          ret = Promise.resolve(result.value);
        } else if (isPromise(result.value)) {
          ret = (
            (result.value instanceof Promise ? result.value : Promise.resolve(result.value))
            .then(onFulfilled, onRejected)
          );
        } else {
          arg = result.value;
          continue;
        }
      }

      break;
    }

    if (spawnRet) spawnRet[current] = ret;
    return ret;
  };

  let onRejected = (arg) => {
    let ret;

    //while (true) {
      if (haltTree) {
        //error.message = haltTree;
        return Promise.reject(haltTree);
      }

      let result;

      try {
        result = generator.throw(arg);
      } catch (err) {
        ret = Promise.reject(err);
      }

      if (result) {
        if (result.done) {
          ret = Promise.resolve(result.value);
        } else {
          ret = (
            (result.value instanceof Promise ? result.value : Promise.resolve(result.value))
            .then(onFulfilled, onRejected)
          );
        }
      }

      //break;
    //}

    if (spawnRet) spawnRet[current] = ret;
    return ret;
  };

  spawnRet = onFulfilled();

  spawnRet[halt] = (msg) => {
    haltTree = msg || 'halted';
    if (spawnRet[current] && spawnRet[current][halt]) spawnRet[current][halt](msg);
  };

  spawnRet[status] = myStatus;
  return spawnRet;
};

P[ensureSymbol('gen')] = function() {
  let promise = this;
  return function*() {return promise;};
};

P[ensureSymbol('by')] = function(gen, opts) {
  if (gen && typeof gen !== 'function') {opts = gen; gen = null;}

  if (opts === 'all') {opts = {all: 1};}
  else if (typeof opts === 'number') {opts = {tube: opts};}
  else if (typeof opts !== 'object') {opts = {};}

  let glOpts = opts;
  if (!glOpts.status) glOpts.status = {};
  let iter = this;

  let getRes = (gen, opts) => function*(args) {
    if (gen && typeof gen !== 'function' && !isPromise(gen)) {opts = gen; gen = null;}

    if (opts === 'all') {opts = {all: 1};}
    else if (typeof opts === 'number') {opts = {tube: opts};}
    else if (typeof opts !== 'object') {opts = {};}

    opts = ({}) [extend](glOpts, opts);
    let results = [];

    let inputs = iter;

    let mapping = (
      iter instanceof Array ||
      typeof iter !== 'object' ||
      isPromise(iter) ||
      iter [get]('constructor.constructor.name', 0) === 'GeneratorFunction'
    ) ? null : inputs [map]((v, k) => ({key: k, value: v}));

    let actions = mapping ? mapping.map(item => item.value) : inputs;
    iter = actions;

    //let act = (item) => {
    //  if (item && typeof item !== 'string' && typeof item !== 'number') item[status] = glOpts.status;
    //  item[spawnact].apply(item, arguments);
    //};

    if (iter instanceof Array && iter.length) {
      if (opts.all) {
        iter = iter.map(item => item[spawnact].apply(item, arguments));
        for (let item of iter) results.push(yield item);
      } else if (opts.tube) {
        let cur = opts.tube;

        let makeRaceId = (index, cur) => (res) => ({index, cur, result: res})

        let chunk = (
          iter.slice(0, cur)

          .map((item, index) => (
            item[spawnact]
            .apply(item, arguments)
            .then(makeRaceId(index, index))
          ))
        );

        for (; cur < iter.length; cur++) {
          let got = yield Promise.race(chunk);
          results[got.cur] = got.result;
          let item = iter[cur];

          chunk[got.index] = (
            item[spawnact]
            .apply(item, arguments)
            .then(makeRaceId(got.index, cur))
          );
        }

        let res = yield Promise.all(chunk);
        for (let item of res) results[item.cur] = item.result;
      } else if (opts.chunk) {
        let cur = opts.chunk;

        for (let cur = 0; cur < iter.length; cur += opts.chunk) {
          let chunk = (
            iter.slice(cur, cur + opts.chunk)
            .map((item, index) => (item[spawnact].apply(item, arguments)))
          );

          let got = yield Promise.all(chunk);
          results.push.apply(results, got);
        }
      } else {
        for (let item of iter) results.push(yield item [spawnact].apply(item, arguments));
      }
    } else if (iter) results = yield iter [spawnact].apply(iter, arguments);

    let mapped = mapping ? results [mapKeys]((v, k) => mapping[k].key) : results;

    if (typeof gen === 'function') {
      if (gen [get]('constructor.name', 0) === 'GeneratorFunction') return yield* gen.apply(mapped, arguments);
      if (gen [get]('constructor.constructor.name', 0) === 'GeneratorFunction') return yield* gen;
      return gen.apply(mapped, arguments);
    } else if (isPromise(gen)) {
      return yield gen;
    } else return mapped;
  };

  if (gen) return getRes(gen);
  return getRes;
};

/**
 * @function delay
 * @description Get a Promise, which is resolved after given wait time.
 * @param {Number} msec Milliseconds to wait.
 * @returns {Promise} Promise which is resolved.
 */
global.delay = (msec) => {
  //let error = new Error() [errstack](1);
  let myHalt;
  let promise;

  promise = new Promise((ok, nok) => {
    if (!msec) return setImmediate(ok);

    let timer = setTimeout(ok, msec);

    myHalt = (msg) => {
      clearTimeout(timer);
      //error.message = msg || 'halted';
      nok(msg || 'halted');
    };

    if (promise) promise[halt] = myHalt;
  });

  if (myHalt) promise[halt] = myHalt;
  promise[status] = {};
  return promise;
};

// express helpers globals

/**
 * @callback Next
 * @description Callback given by Express to call for executing next middleware.
 * @param {*} data Data to pass to next middleware
 * @param {Response} res
 * @param {Next} next
 */

/**
 * @callback Middleware
 * @description Callback is called by Express to process the request, make a response and/or call next middleware.
 * @param {Request} req A request from client.
 * @param {Response} res A response to be replied to client
 * @param {Next} next Call next middleware
 */

/**
 * @callback Promiseware
 * @description A Promise-optimal middleware, which gets converted to native Express middleware
 *    to take advantage of using Promises and functional programming.
 * @param {Request} req A request from client. `req.res` is a `Response`.
 * @returns {Promise} A Promise, which is resolved to call the next middleware.
 */


/**
 * @function promiseware
 * @description Convert Promise-optimal representation of middleware to native Express middleware.
 * @param {Promiseware} func A promiseware to be converted.
 * @returns {Middleware} An Express middleware.
 */
global.promiseware = (func) => (req, res, next) => (
  vala(req)
  [thena](func, true)
  [thena](next)
  [catcha]((err) => {
    if (err && typeof err === 'object') err[syncFail] = true;
    next(err);
  })
);

global.genware = (func) => (req, res, next) => (
  func(req, res) [pro]()
  .then(next)

  .catch((err) => {
    if (err && typeof err === 'object') err[syncFail] = true;
    next(err);
  })
);

global.genwareresult = (func) => (resp, req, res, next) => (
  func(resp, req, res) [pro]()

  .catch((err) => {
    if (err && typeof err === 'object') err[syncFail] = true;
    next(err);
  })
);

/**
 * @function spawnware
 * @description Convert Promise-optimal and Spawn-style representation of middleware to native Express middleware.
 * @param {Spawnware} func A promiseware to be converted.
 * @returns {Middleware} An Express middleware.
 */
global.spawnware = (func) => promiseware((req) => spawn(func, req));

/**
 * @name byId
 * @description An object, used in hints etc. to identify usage of only `_id` path.
 * @type {Object}
 */
global.byId = {_id: 1};

// events

/**
 * @name event
 * @description Promisify waiting for specific events. Other events are ignored unless specified in 2nd argument
 * @type Symbol
 */


P[ensureSymbol('event')] = function(subs, throws, opts) {
  if (!opts) opts = {};

  //let error = new Error() [errstack](1);
  let unsubs = [];

  let p = Promise.defer();

  let subone = (sub, func) => {
    let wfunc = function(data) {func({event: sub, data: data, args: [].slice.call(arguments)});};
    unsubs.push({sub: sub, func: wfunc});

    if (opts.subMethod) opts.subMethod.call(this, sub, wfunc);
    else if (this.on) this.on(sub, wfunc);
    else if (this.addEventListener) this.addEventListener(sub, wfunc);

    else {
      //error.message = 'subMethod not found';
      p.reject('subMethod not found');
    }
  };

  let unsuball = () => unsubs.forEach(v => {
    try {
      if (opts.unsubMethod) opts.unsubMethod.call(this, v.sub, v.func);
      else if (this.removeListener) this.removeListener(v.sub, v.func);
      else if (this.removeEventListener) this.removeEventListener(v.sub, v.func);
      else if (this._on) delete this._on[v.sub];
      else if (this.removeAllListeners) this.removeAllListeners(v.sub);
      else out.warn('[ESF] event: unsubMethod not found.');
    } catch (err) {
      out.err('[ESF] event: unsubMethod error:', err.stack || err);
    }
  });

  new Promise((ok, nok) => {
    [subs || []] [flatten]().forEach(ev => subone(ev, (ev) => {
      unsuball();
      setImmediate(ok, ev);
    }));

    [throws || []] [flatten]().forEach(ev => subone(ev, (ev) => {
      unsuball();
      setImmediate(nok, opts.detailError ? ev : ev.data);
    }));
  })
  [thena](p.resolve)
  [catcha](p.reject);

  p.promise[halt] = (msg) => {
    unsuball();
    error.message = msg || 'halted';
    p.reject(error);
  };

  return p.promise;
};



P[ensureSymbol('spawnafter')] = function(gen, arg) {
  let base = this;

  let sub = (func, arg) => spawn(function*() {
    yield base;
    return yield spawn(func, arg);
  });

  if (gen) return sub(gen, arg);
  else return sub;
};

// handle global errors if main module

if (!global.finalizers) global.finalizers = {};

P[ensureSymbol('finalizer')] = function(func) {
  if (typeof func !== 'function') return out.warn('[ESF] Finalizer may be specified only as action function');
  finalizers[this.filename] = func;
};

global.exit = (code) => spawn(function*() {
  try {
    yield finalizers [all]({args: [code]});
  } catch (err) {
    out.error('[ESF] critical error in finalizer');
    out.exception(err);
  }

  global.esfunctionalCleanExit = true;
  process.exit(code);
});

// {
//   opts: {
//     stay: Boolean  // do not shutdown process after main ends
//   }
// }
P[ensureSymbol('main')] = function(init, opts) {
  let module = this;
  if (!opts) opts = {};

  if (require.main === module) {
    if (!global.esfunctionalMainInited) {
      global.esfunctionalMainInited = true;

      process.on('exit', () => {
        if (!global.esfunctionalCleanExit) {
          out.warn(chalk.bold(
            'Application or one of the modules just have called "process.exit(...)", ' +
            'which makes esfunctional asynchronous modules clean finalization impossible. ' +
            'If it\'s NOK, please refactor your code to use esfunctional\'s "exit(...)" instead.'
          ));
        }
      });

      global.exceptionHandler = (err) => {
        out.exception(err);
        emergencyExit('error', err);
      };

      global.emergencyExit = () => {console.log();exit(1);};

      process.on('SIGTERM', () => emergencyExit('SIGTERM'));
      process.on('SIGHUP', () => emergencyExit('SIGHUP'));
      process.on('SIGINT', () => emergencyExit('SIGINT'));

      process.on('unhandledException', exceptionHandler);
    }

    let inited = init [spawnact]();
    if (!opts.stay) inited = inited.then(exit);
    inited = inited.catch(exceptionHandler);
    return inited;
  }

  return false;
};


ensureSymbol('locked');


P[ensureSymbol('lock')] = unbind((obj) => spawn(function*() {
  while (obj[locked]) yield obj[locked].promise;
  obj[locked] = Promise.defer();
}));



P[ensureSymbol('unlock')] = unbind((obj) => {
  if (obj[locked]) {
    let p = obj[locked];
    delete obj[locked];
    p.resolve(true);
  }
});

P[ensureSymbol('errstack')] = function(back, max) {
  let error = this;
  let message = this.message;

  if (!back) back = 0;

  if (!error.stack) {
    message = typeof this === 'object' ? JSON.stringify(this, null, 2) : this;
    error = new Error(message);
    back++;
  }

  let stack = error.stack.split('\n');
  stack.splice(0, back + 1);
  if (max) stack.splice(max);
  stack = stack.join('\n');

  error.stack = `Error: ${this.stack ? error.message : message}\n${stack}`;
  return error;
};

// output helper

if (!global.out) global.out = {};

out.setNs = out.ns = (ns, replace) => {
  if (!global.outNs) global.outNs = process.env.NODE_ESF_OUTNS ? process.env.NODE_ESF_OUTNS.split(' ') : [];
  if (replace) global.outNs.pop();
  if (ns) global.outNs.push(ns);
  process.env.NODE_ESF_OUTNS = global.outNs.join(' ');
};

out.nsPfx = () => global.outNs ? `${global.outNs.join(' ')} ` : '';

out.debug = function() {return (out.debugMode) && console.log.apply(
  console,
  [chalk.bold.cyan('[' + out.nsPfx() + 'debug]')].concat([].slice.call(arguments))
);};

out.info = function() {return console.log.apply(
  console,
  [chalk.bold.green('[' + out.nsPfx() + 'info]')].concat([].slice.call(arguments))
);};

out.warn = function() {return console.log.apply(
  console,
  [chalk.bold.yellow('[' + out.nsPfx() + 'warn]')].concat([].slice.call(arguments))
);};

out.error = function() {return console.log.apply(
  console,
  [chalk.bold.red('[' + out.nsPfx() + 'error]')].concat([].slice.call(arguments))
);};

out.exception = (err) => {
  console.log('');
  out.error(chalk.bold.gray('@'), chalk.yellow(new Date().toISOString()));

  out.info(
    err instanceof Error ? prettyError.render(err) :
    err ? chalk.cyan(JSON.stringify(err.message || err, null, 2)) :
    chalk.bold.red('unknown error')
  );

  return err.name === 'SyntaxError';
};

// test helper -- lacks

let mustHaveOut = (prefix, color, indent, key, value, comment) => (
  chalk.bold[color](prefix) +
  ' ' +

  chalk[color](
    new Array(indent + 1).join('  ') +
    (key == null ? '' : JSON.stringify(key) + ' : ') +
    value
  ) +

  (comment ? chalk.bold.yellow(' // ') + chalk.yellow(comment) : '') + '\n'
);

let mustHaveIter = function(that, key, indent) {

  //jshint maxcomplexity: 13

  let typeOf = (value) => (
    value === undefined ? 'undefined' :
    value === null ? 'null' :
    value instanceof Function ? value.name :
    value.constructor.name
  );

  let typeOfThis = typeOf(this);
  let typeOfThat = typeOf(that);
  indent |= 0;

  if (typeOfThis !== typeOfThat) {
    return (
      mustHaveOut('+', 'green', indent, key, typeOfThat, 'should be of type, ...') +
      mustHaveOut('-', 'red', indent, key, typeOfThis, '... but is of type.')
    );
  }

  if (that instanceof Function) return '';

  let isArray = typeOfThis === 'Array';

  if (!isArray && typeOfThis !== 'Object') return (this && this.valueOf()) === (that && that.valueOf()) ? '' : (
    mustHaveOut('+', 'green', indent, key, JSON.stringify(that), 'should be value, ...') +
    mustHaveOut('-', 'red', indent, key, JSON.stringify(this), '... but is value.')
  );

  let out = '';
  let hasError = false;

  for (let subkey in that) {
    let outkey = isArray ? null : subkey;
    if (that[subkey] === undefined && (subkey in this)) {
      out += mustHaveOut('-', 'red', indent + 1, outkey, typeOf(this[subkey]), 'should not exist, but is of type.');
      hasError = true;
    } else if (that[subkey] !== undefined && !(subkey in this)) {
      out += mustHaveOut('+', 'green', indent + 1, outkey, typeOf(that[subkey]), 'should be of type, but not exist.');
      hasError = true;
    } else {
      let line = mustHaveIter.call(this[subkey], that[subkey], outkey, indent + 1);
      if (line) {
        out += line;
        hasError = true;
      } else {
        out += mustHaveOut('.', 'gray', indent + 1, outkey, typeOf(that[subkey]));
      }
    }
  }

  if (hasError) {
    if (isArray) return (
      mustHaveOut('\\', 'cyan', indent, key, '[') + out + mustHaveOut('/', 'cyan', indent, null, ']')
    );

    return mustHaveOut('\\', 'cyan', indent, key, '{') + out + mustHaveOut('/', 'cyan', indent, null, '}');
  }

  return '';
};



P[ensureSymbol('lacks')] = function(that) {
  let output = mustHaveIter.call(this, that);

  if (output) {
    out.info(chalk.bold.red('Test difference:\n'));
    console.log(output);
    return true;
  }

  return false;
};



P[ensureSymbol('test')] = function(what, that) {
  let does = (this) [lacks](that);
  if (does) throw what [errstack](1, 1);
};

if (!RegExp.escape) {
  RegExp.escape = s => s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

// FRAMEWORK

S.inherit = function(mod) {
  let submod = Object.create(this);
  if (mod) mod.exports = submod;
  return submod;
};

S.inited = true;

S.ok = function*() {
  yield this.inited;
};

S.okReady = function*() {};

S.init = function(gen) {
  if (this.preload) this.preload();
  let inited = this.inited;
  let initializer = this.initializer;
  let finalizer = this.finalizer;
  this.ok = S.ok;

  this.inited = (function*() {
    yield inited;
    if (gen) yield* gen.call(this);
    if (initializer) yield* initializer.call(this);
    if (finalizer) esfunctionalFinalizers.push({ctx: this, gen: finalizer});
    if (this.postInit) yield* this.postInit();
    this.ok = S.okReady;
  }).call(this) [pro]();

  this.by = this.inited [by]();
};

module [finalizer](function*() {
  yield* esfunctionalFinalizers.map(fin => function*() {yield* fin.gen.call(fin.ctx);}) [by]('all')()();
});
