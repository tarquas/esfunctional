'use strict';
const S = require('esfunctional').inherit(module);

S.httpErrors = require('./http-errors');
const http = require('http');
const express = require('express');
const cors = require('cors');
const compression = require('compression');

// in:
S.port = null;

// S.httpErrors [{errorId: {code: Number, message: String}}]

// out:
S.app = null;
S.server = null;

// S.status
// S.boundP : Promise
// S.bound : GeneratorFunction

S.processInternalError = function* processInternalError(arg) {
  const req = arg.req;
  let resp = arg.resp;

  const thrownAt = new Date().toISOString();

  req.res.status(500);

  out.error(`Unhandled at: ${req.method} ${req.path} @ ${thrownAt}`);
  out.info(resp.stack || resp.message || resp);

  resp = {
    error: 'internal',
    message: resp.message,
    thrownAt
  };

  return resp;
};

S.processHttpError = function* processHttpError(arg) {
  const req = arg.req;
  let resp = arg.resp;

  const errId = resp[0];
  const error = req.webModule.httpErrors[errId];

  req.res.status((error && error.code) || 500);

  resp = {
    error: errId,
    message: error && error.message
  };

  return resp;
};

S.processError = function* processError(arg) {
  const req = arg.req;
  let resp = arg.resp;

  if (resp instanceof Error) {
    resp = yield* S.processInternalError({resp, req});
  } else if (resp instanceof Array && resp[0]) {
    resp = yield* S.processHttpError({resp, req});
  } else if (resp && resp[syncFail]) {
    const thrownAt = new Date().toISOString();
    const errId = resp.error || 'unknown';
    const error = req.webModule.httpErrors[errId];

    req.res.status((error && error.code) || 500);

    resp [defaults]({
      message: error.message,
      thrownAt
    });

    return resp;
  }

  return resp;
};

S.response = function* response(resp, req, res) {
  const resp2 = yield* S.processError({resp, req});

  if (typeof resp2 === 'object') {
    res.header('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(resp2, null, 2));
    return;
  }

  res.end(resp2 && resp2.toString());
};

S.responseMiddleware = genwareresult(S.response);

S.readiness = [];
S.readinessDefer = Promise.defer();
S.boundP = S.readinessDefer.promise;

S.bound = function* bound() {
  yield this.boundP;
};

S.allBoundP = S.boundP;

S.allBound = function* allBound() {
  yield this.allBoundP;
};

S.init();

S.preload = function preload() {
  this.ready = Promise.defer();
  this.readiness.push(this.ready.promise);
};

S.postInit = function* postInit() {
  if (this.ready) this.ready.resolve(this);
};

S.assignWebModule = (mod) => function* assignWebModule(req) {
  req.webModule = mod;
};

S.initializer = function* initializer() {
  if (this.port && !this.server) {
    this.app = express();
    this.server = new http.Server(this.app);
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

S.initializeServers = function* initializeServers() {
  for (const mod of this) {
    if (mod.status.finished) {
      out.info(chalk.bold.yellow('Web'), 'Service:', chalk.bold.cyan(mod.alias));
    } else {
      mod.app.use(mod.responseMiddleware);
      yield mod.server [promisify]('listen')(mod.port | 0);

      out.info(
        chalk.bold.yellow('Web'),
        'Server',
        chalk.bold.cyan(mod.alias),
        'listens @',
        chalk.cyan(mod.port)
      );

      mod.status.finished = true;
      mod.bound = S.okReady;
      mod.readinessDefer.resolve();
    }
  }

  S.bound = S.allBound = S.okReady;
  S.readinessDefer.resolve();
};

setImmediate(function deferredReadiness() {
  S.readiness [by](S.initializeServers) [pro]().catch(err => out.exception(err));
});

S.finalizer = function* finalizer() {
  yield this.ready;

  if (this.server) {
    this.server.close();
    this.server = null;
    out.warn(chalk.bold.yellow('Web'), chalk.yellow('Server socket closed'));
  }
};
