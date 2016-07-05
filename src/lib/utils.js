'use strict';

/**
 * hojs
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

import {resolve as resolvePath} from 'path';
import express from 'express';

/**
 * 获取调用当前函数的源码地址
 *
 * @param {String} dir 项目所在目录
 * @return {String} 返回调用堆栈中第一个项目所在目录的文件
 */
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

/**
 * 创建一个Express Router
 *
 * @return {Object}
 */
export function createRouter() {
  return express.Router({
    caseSensitive: true,
    mergeParams: true,
    strict: true,
  });
}

/**
 * 合并参数
 *
 * @param {Object} a
 * @param {Object} b
 * @return {Object}
 */
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

/**
 * 包装中间件，使其支持async/await
 *
 * @param {Function} fn
 * @return {Function}
 */
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

/**
 * 获取API的Key
 *
 * @param {String} method
 * @param {String} path
 * @return {String}
 */
export function getSchemaKey(method, path) {
  return `${method.toUpperCase()} ${path}`;
}
