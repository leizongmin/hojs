'use strict';

/**
 * hojs
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

import assert from 'assert';
import {core as debug} from '../debug';

export default function () {

  this.api.formatOutput = (fn) => {
    assert(typeof fn === 'function', 'output handler must be function');
    assert(fn.length === 2, 'output handler must have 2 arguments');
    this.api.setOption('formatOutput', fn);
    return this.api;
  };
  this.api.formatOutput((err, ret) => {
    if (err) {
      const ret = {error: {}};
      if (err instanceof Error) {
        ret.status = ret.status || err.status || -1;
        ret.message = err.message;
        for (const n in err) {
          if (n === 'status' || n === 'message') continue;
          ret.error[n] = err[n];
        }
      } else {
        ret.status = -1;
        ret.message = ret.toString();
      }
      return ret;
    } else {
      return {status: 0, result: ret};
    }
  });

  this.api.hookOutput = (fn) => {
    assert(typeof fn === 'function', 'output handler must be function');
    assert(typeof fn({}) !== 'undefined', 'output handler must return a value');
    this.api.$hookOutputs.push(fn);
  };

};
