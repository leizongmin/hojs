'use strict';

/**
 * hojs
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

import assert from 'assert';
import {wrapAsyncMiddleware} from '../utils';
import {core as debug} from '../debug';

export default function () {

  this.api.use = (...list) => {
    for (const fn of list) {
      this.api.$express.middlewares.push(this._getApiMiddleware(fn));
    }
  };

  this.api.registerMiddleware = (name, fn) => {
    assert(typeof name === 'string', 'middleware name must be string');
    assert(typeof fn === 'function', 'middleware handler must be function');
    assert(fn.length === 2 || fn.length === 3, 'middleware handler must have 3 arguments: function (req, res, next), or 2 arguments: async function (req, res)');
    assert(!this.api.$middlewaresMapping[name], `middleware ${name} is already exists`);
    this.api.$middlewaresMapping[name] = wrapAsyncMiddleware(fn);
  };

};
