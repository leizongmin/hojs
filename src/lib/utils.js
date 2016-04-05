'use strict';

/**
 * hojs
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

import {resolve as resolvePath} from 'path';
import express from 'express';

export function getCallerSourceLine(dir) {
  dir = resolvePath(dir);
  const stack = (new Error()).stack.split('\n').slice(1);
  for (let line of stack) {
    line = line.trim();
    if (line.replace(/\\/g, '/').indexOf(dir) !== -1) {
      const s = line.match(/\((.*)\)\s*$/);
      if (s) {
        return {
          relative: s[1].slice(dir.length + 1),
          absolute: s[1],
        };
      }
    }
  }
  return {relative: null, absolute: null};
}

export function createRouter() {
  return express.Router({
    caseSensitive: true,
    mergeParams: true,
    strict: true,
  });
}

export function mergeParams(...list) {
  const ret = {};
  for (const item of list) {
    if (item && typeof item === 'object') {
      for (const i in item) {
        ret[i] = item[i];
      }
    }
  }
  return ret;
}

export function wrapAsyncMiddleware(fn) {
  if (fn.length === 2) {
    return function (req, res, next) {
      let p = null;
      try {
        p = fn(req, res);
      } catch (err) {
        return next(err);
      }
      p.then(ret => next());
      p.catch(err => next(err));
    };
  } else {
    return fn;
  }
}
