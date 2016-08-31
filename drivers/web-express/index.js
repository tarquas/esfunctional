'use strict';
let S = require('esfunctional').inherit(module);

S.httpErrors = require('./http-errors');
let http = require('http');
let express = require('express');
let cors = require('cors');
let compression = require('compression');

// in:
S.port = null;
//S.httpErrors [{errorId: {code: Number, message: String}}]

// out:
S.app = null;
S.server = null;
//S.status
//S.boundP : Promise
//S.bound : GeneratorFunction

S.processInternalError = function*(arg) {
  let req = arg.req;
  let resp = arg.resp;

  let thrownAt = new Date().toISOString();

  req.res.status(500);

  out.error(`Unhandled at: ${req.method} ${req.path} @ ${thrownAt}`);
  out.info(resp.stack || resp.message || resp);

  resp = {
    error: 'internal',
    message: resp.message,
    thrownAt: thrownAt
  };

  return resp;
};

S.processHttpError = function*(arg) {
  let req = arg.req;
  let resp = arg.resp;

  let errId = resp[0];
  let error = req.webModule.httpErrors[errId];

  req.res.status(error && error.code || 500);

  resp = {
    error: errId,
    message: error && error.message
  };

  return resp;
};

S.processError = function*(arg) {
  let req = arg.req;
  let resp = arg.resp;

  if (resp instanceof Error) {
    resp = yield* S.processInternalError({resp, req});
  } else if (resp instanceof Array && resp[0]) {
    resp = yield* S.processHttpError({resp, req});
  } else if (resp && resp[syncFail]) {
    let thrownAt = new Date().toISOString();
    let errId = resp.error || 'unknown';
    let error = req.webModule.httpErrors[errId];

    req.res.status(error && error.code || 500);

    resp [defaults]({
      message: error.message,
      thrownAt: thrownAt
    });

    return resp;
  }

  return resp;
};

S.response = function*(resp, req, res) {
  resp = yield* S.processError({resp, req});

  if (typeof resp === 'object') {
    res.header('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(resp, null, 2));
    return;
  }

  res.end(resp && resp.toString());
};

S.responseMiddleware = genwareresult(S.response);

S.readiness = [];
S.readinessDefer = Promise.defer();
S.boundP = S.readinessDefer.promise;
S.bound = function*() {yield this.boundP;}
S.allBoundP = S.boundP;
S.allBound = function*() {yield this.allBoundP;};

S.init();

S.preload = function() {
  this.ready = Promise.defer();
  this.readiness.push(this.ready.promise);
};

S.postInit = function*() {
  if (this.ready) this.ready.resolve(this);
};

S.assignWebModule = (mod) => function*(req) {
  req.webModule = mod;
};

S.initializer = function*() {
  if (this.port && !this.server) {
    this.app = express();
    this.server = http.Server(this.app);
    this.status = {};
    this.readinessDefer = Promise.defer();
    this.boundP = this.readinessDefer.promise;

    this.app.use(cors({
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Company-ID', 'X-Client-Version'],
      exposedHeaders: ['Content-Type', 'Date', 'X-Runtime']
    }));

    this.app.use(compression({level: 9}));
    if (this.httpErrors) this.httpErrors = Object.create(S.httpErrors) [extend](this.httpErrors);
    this.app.use(genware(S.assignWebModule(this)));
  }
};

S.initializeServers = function*() {
  for (let mod of this) {
    if (mod.status.finished) {
      out.info(chalk.bold.yellow('Web'), 'Service:', chalk.bold.cyan(mod.alias));
    } else {
      mod.app.use(mod.responseMiddleware);
      yield mod.server [promisify]('listen')(mod.port);
      out.info(chalk.bold.yellow('Web'), 'Server', chalk.bold.cyan(mod.alias), 'listens @', chalk.cyan(mod.port));
      mod.status.finished = true;
      mod.bound = S.okReady;
      mod.readinessDefer.resolve();
    }
  }

  S.bound = S.allBound = S.okReady;
  S.readinessDefer.resolve();
};

setImmediate(function() {
  S.readiness [by](S.initializeServers) [pro]().catch(err => out.exception(err));
});

S.finalizer = function*() {
  yield this.ready;

  if (this.server) {
    this.server.close();
    this.server = null;
    out.warn(chalk.bold.yellow('Web'), chalk.yellow('Server socket closed'));
  }
};
