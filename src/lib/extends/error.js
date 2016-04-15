'use strict';

/**
 * hojs
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

import assert from 'assert';
import registerDefaultErrors from '../default/errors';
import {core as debug} from '../debug';

export default function () {

  this.api.registerError = (name, data = {}) => {
    assert(typeof name === 'string', 'error name must be string');
    assert(data && typeof data === 'object', 'second argument must be object');
    assert(data.status, 'missing option `status`');
    const info = {};
    if (data.message) {
      assert(typeof data.message === 'string' || typeof data.message === 'function', 'option `message` must be function or string');
      info.message = data.message;
      if (typeof info.message !== 'function') {
        const msg = info.message;
        info.message = () => msg;
      }
    } else {
      info.message = (msg) => msg;
    }
    if (data.description) {
      assert(typeof data.description, 'option `description` must be string');
    }
    info.data = this.utils.merge(data, {type: name});
    delete info.data.message;
    info.Error = this.utils.customError(name, info.data);
    debug('registerError: %s %j', name, data);
    this.api.$errors[name] = info;

    return this.api;
  };

  this.api.error = (name, msg, data) => {
    assert(this.api.$errors[name], `unknown error type ${name}`);
    const info = this.api.$errors[name];
    msg = info.message(msg, data || {});
    const err = new info.Error(msg, data);
    return err;
  };

  registerDefaultErrors(this.api.registerError);

};
