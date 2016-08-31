'use strict';
let S = require('esfunctional').inherit(module);

let stripe = require('stripe');

// in:
S.alias = null; // Alias
S.key = null; // Secret API key: sk_
S.pubKey = null; // Public API key: pk_

// out:
// S.stripeCall(methodChain...)(arguments...) : Promise;
// S.call*(methodChain...)(arguments...) : Object;
// S.webCall*(methodChain...)(arguments...) : Object;

S.init();

S.initializer = function*() {
  if (this.key && !this.stripeCall) {
    this.stripeCall = stripe(this.key) [promisifyAll]();
    yield this.stripeCall('disputes', 'list')();
    if (!this.alias) this.alias = this.pubKey;
    out.info(chalk.bold.yellow('Pay'), chalk.green('Connected to Stripe:'), chalk.bold.cyan(this.alias));
  }
};

S.finalizer = function*() {
  if (this.stripeCall) {
    this.stripeCall = null;
    out.warn(chalk.bold.yellow('Pay'), chalk.yellow('Disconnected from Stripe:'), chalk.bold.cyan(this.alias));
  }
};

S.call = function() {
  let _this = this;
  let stripeMethod = this.stripeCall.apply(this, arguments);

  return function*() {
    yield* _this.ok();
    return yield stripeMethod.apply(this, arguments);
  };
};

S.webCall = function() {
  let _this = this;
  let stripeMethod = this.stripeCall.apply(this, arguments);

  return function*() {
    yield* _this.ok();

    try {
      return yield stripeMethod.apply(this, arguments);
    } catch (err) {
      throw err [pick]('code', 'message') [extend]({error: 'stripeError'});
    }
  };
};
