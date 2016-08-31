'use strict';
let S = require('esfunctional').inherit(module);

let Amqplib = require('amqplib');
let uuid = require('node-uuid');
let url = require('url');

//in:
S.alias = null; // Alias
S.rabbit = null; // AMQP link

// out:
// S.conn : rabbitConnection
// S.objToBuffer*(obj: Object) : Buffer;
// S.bufferToObj*(buffer: Buffer) : Object;
// S.push*(queueId: String, payload: Object) : sendToQueueResult;
// S.worker*(queueId: String, onData: GeneratorFunction);
// S.rpc*(queueId: String, payload: Object) : sendToQueueResult;
// S.rpcWorker*(queueId: String, onData: GeneratorFunction);

S.instanceCreatedAt = new Date() - 0;
S.instanceMinor = 0;

S.init();

S.initializer = function*() {
  if (this.rabbit && !this.conn) {
    this.conn = yield Amqplib.connect(this.rabbit);
    if (!this.alias) this.alias = url.parse(this.rabbit).hostname;
    out.info(chalk.bold.yellow('Mq'), chalk.green('Connected to Rabbit:'), chalk.bold.cyan(this.alias));
  }

  if (this.workers) yield* this.workers [by]('all')()();
};

S.finalizer = function*() {
  if (this.conn) {
    this.conn.close();
    this.conn = null;
    out.warn(chalk.bold.yellow('Mq'), chalk.yellow('Disconnected from Rabbit:'), chalk.bold.cyan(this.alias));
  }
};

S.objToBuffer = function*(obj) {
  let data = new Buffer(JSON.stringify(obj), 'utf8');
  return data;
};

S.bufferToObj = function*(buffer) {
  let decoded = JSON.parse(buffer.toString('utf8'));
  return decoded;
};

S.push = function*(id, payload) {
  yield* this.ok();
  let ch = yield this.conn.createChannel();

  try {
    yield ch.assertQueue(id, {durable: true});
    let data = yield* S.objToBuffer(payload);
    let sent = yield ch.sendToQueue(id, data, {deliveryMode: true});
    return sent;
  } finally {
    ch.close();
  }
};

S.worker = function(id, onData) {
  let done = (function*() {
    yield* this.ok();
    let ch = yield this.conn.createChannel();

    yield ch.assertQueue(id, {durable: true});
    ch.prefetch(1);

    yield ch.consume(id, (msg) => spawn(function*() {
      if (!msg) return;
      let decoded = yield* S.bufferToObj(msg.content);

      try {
        yield* onData(decoded);
      } catch (err) {
        out.exception(err [errstack](1));
        throw err;
      }

      ch.ack(msg);
    }), {noAck: false});

    out.info(chalk.bold.yellow('Mq'), 'Registered', chalk.bold.cyan(id), 'worker on', chalk.cyan(this.alias));
  }).call(this) [pro]();

  if (!this.workers) this.workers = [];
  this.workers.push(done);
};

S.rpc = function*(id, payload) {
  yield* this.ok();
  let ch = yield this.conn.createChannel();
  let answer = Promise.defer();

  try {
    let corrId = uuid();
    let qok = yield ch.assertQueue('', {exclusive: true});
    let queue = qok.queue;

    yield ch.consume(queue, (msg) => spawn(function*() {
      if (msg.properties.correlationId === corrId) {
        let decoded = yield* S.bufferToObj(msg.content);

        if (decoded.error) {
          if (decoded.error.isError) {
            let toThrow = new Error(decoded.error.message);
            if (decoded.error.stack) toThrow.stack = decoded.error.stack;
            answer.reject(toThrow);
          } else answer.reject(decoded.error);
        } else answer.resolve(decoded.data);
      }
    }));

    let data = yield* S.objToBuffer(payload);
    yield ch.sendToQueue(id, data, {correlationId: corrId, replyTo: queue});
    return yield answer.promise;
  } catch (err) {
    throw err;
  } finally {
    ch.close();
  }
};

S.rpcWorker = function(id, onData) {
  let done = (function*() {
    yield* this.ok();
    let ch = yield this.conn.createChannel();

    yield ch.assertQueue(id, {durable: false});
    ch.prefetch(1);

    yield ch.consume(id, (msg) => spawn(function*() {
      if (!msg) return;
      let decoded = yield* S.bufferToObj(msg.content);
      let response;

      try {
        response = {data: yield* onData(decoded)};
      } catch (err) {
        if (err instanceof Error) {
          let encErr = {isError: true, message: err.message, stack: err.stack};
          response = {error: encErr};
        } else {
          response = {error: err};
        }
      }

      let data = yield* S.objToBuffer(response);

      try {
        yield ch.sendToQueue(
          msg.properties.replyTo,
          data,
          {correlationId: msg.properties.correlationId}
        );
      } catch (err) {
      }

      ch.ack(msg);
    }), {noAck: false});

    out.info(chalk.bold.yellow('Mq'), 'Registered', chalk.bold.cyan(id), 'RPC worker on', chalk.cyan(this.alias));
  }).call(this) [pro]();

  if (!this.workers) this.workers = [];
  this.workers.push(done);
};
