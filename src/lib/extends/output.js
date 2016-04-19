'use strict';

/**
 * hojs
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

import assert from 'assert';
import {core as debug} from '../debug';

export default function () {

  const IS_DEFAULT = Symbol('is default');

  this.api.formatOutput = (fn) => {
    assert(typeof fn === 'function', 'output handler must be function');
    assert(fn.length === 2, 'output handler must have 2 arguments');
    try {
      const ret = fn(new Error('test formatOutput'));
    } catch (err) {
      throw new Error(`test formatOutput(err) failed: ${err.stack}`);
    }
    try {
      const ret = fn(null, {ok: true});
    } catch (err) {
      throw new Error(`test formatOutput(null, data) failed: ${err.stack}`);
    }
    this.api.setOption('formatOutput', fn);
    return this.api;
  };
  const defaultFormatOutput = (err, ret) => {
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
  };
  defaultFormatOutput[IS_DEFAULT] = true;
  this.api.formatOutput(defaultFormatOutput);

  this.api.formatOutputReverse = (fn) => {
    assert(typeof fn === 'function', 'reverse output handler must be function');
    assert(fn.length === 1, 'reverse output handler must have 1 arguments');
    const formatOutput = this.api.getOption('formatOutput');
    try {
      const ret = fn(formatOutput(new Error('test formatOutput')));
    } catch (err) {
      throw new Error(`test formatOutputReverse(err) failed: ${err.stack}`);
    }
    try {
      const ret = fn(formatOutput(null, {ok: true}));
      assert(Array.isArray(ret) && ret.length === 2, `must return an array and only includes 2 items`);
      assert(ret[0] === null, `if not error, the first item must be null`);
    } catch (err) {
      throw new Error(`test formatOutputReverse(null, data) failed: ${err.stack}`);
    }
    this.api.setOption('formatOutputReverse', fn);
    return this.api;
  };
  const defaultFormatOutputReverse = (data) => {
    if (data.status === 0) {
      return [null, data.result];
    } else {
      return [data];
    }
  };
  defaultFormatOutputReverse[IS_DEFAULT] = true;
  this.api.formatOutputReverse(defaultFormatOutputReverse);

  this.api.hookOutput = (fn) => {
    assert(typeof fn === 'function', 'output handler must be function');
    assert(typeof fn({}) !== 'undefined', 'output handler must return a value');
    debug('hookOutput: %s', fn);
    this.api.$hookOutputs.push(fn);
  };

};
