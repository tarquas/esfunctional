'use strict';
const S = require('esfunctional').inherit(module);

const mongoose = require('mongoose');

// in:
S.alias = null;
S.mongodb = null;
S.connOptions = null;
S.schema = null;

// out:
// S.conn : mongoose.connection (@ S.mongo)
// S.model : mongoose.Model (@ S.schema)

mongoose.Promise = global.Promise;

S.Schema = mongoose.Schema;
S.Types = mongoose.Types;

S.errors = {
  duplicate: 11000
};

S.init();

S.modelInitializer = function* modelInitializer() {
  if (!this.schema.options.collection) throw new Error('Schema must have `collection` set');
  this.model = this.conn.model(this.schema.options.collection, this.schema);
};

S.initializer = function* initializer() {
  if (this.mongodb && !this.conn) {
    yield new Promise((ok, nok) => {
      this.conn = mongoose.createConnection(
        this.mongodb,
        this.connOptions || {},
        oknok(ok, nok)
      );
    });

    yield this.conn.db [promisify]('collections')();
    if (!this.alias) this.alias = this.conn.db.name;

    out.info(
      chalk.bold.yellow('Db'),
      chalk.green('Connected to Mongo:'),
      chalk.bold.cyan(this.alias)
    );
  }

  if (this.schema) yield* this.modelInitializer();
};

S.finalizer = function* finalizer() {
  if (this.conn) {
    this.conn.close();
    this.conn = null;

    out.warn(
      chalk.bold.yellow('Db'),
      chalk.yellow('Disconnected from Mongo:'),
      chalk.bold.cyan(this.alias)
    );
  }
};
