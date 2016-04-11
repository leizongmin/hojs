'use strict';

/**
 * hojs
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

import assert from 'assert';
import {core as debug} from '../debug';

export default function () {

  this.api.output = (fn) => {
    assert(typeof fn === 'function', 'output handler must be function');
    assert(fn.length >= 4, 'output handler must have 4 or 5 arguments');
    this.api.setOption('handleOutput', fn);
    return this.api;
  };
  this.api.output((err, ret, req, res, next) => {
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
      res.json(ret);
    } else {
      res.json({status: 0, result: ret});
    }
  });

  this.api.hookOutput = (fn) => {
    assert(typeof fn === 'function', 'output handler must be function');
    assert(typeof fn({}) !== 'undefined', 'output handler must return a value');
    this.api.$hookOutputs.push(fn);
  };

  this.api.outputDocs = (path) => {
    this.api.setOption('docsPath', path);
  };

};
