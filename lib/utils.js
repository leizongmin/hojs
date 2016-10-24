'use strict';

/**
 * hojs
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

const resolvePath = require('path').resolve;
module.exports = exports = require('lei-utils').extend({});

/**
 * 获取调用当前函数的源码地址
 *
 * @param {String} dir 项目所在目录
 * @return {String} 返回调用堆栈中第一个项目所在目录的文件
 */
exports.getCallerSourceLine = function getCallerSourceLine(dir) {
  const resolvedDir = resolvePath(dir);
  const stack = (new Error()).stack.split('\n').slice(1);
  for (let line of stack) {
    line = line.trim();
    if (line.replace(/\\/g, '/').indexOf(resolvedDir) !== -1) {
      const s = line.match(/\((.*)\)\s*$/);
      if (s) {
        return {
          relative: s[1].slice(resolvedDir.length + 1),
          absolute: s[1],
        };
      }
    }
  }
  return { relative: null, absolute: null };
};

/**
 * 合并参数
 *
 * @param {Object} a
 * @param {Object} b
 * @return {Object}
 */
exports.mergeParams = function mergeParams(...list) {
  const ret = {};
  for (const item of list) {
    if (item && typeof item === 'object') {
      for (const i in item) {
        ret[i] = item[i];
      }
    }
  }
  return ret;
};

/**
 * 获取API的Key
 *
 * @param {String} method
 * @param {String} path
 * @return {String}
 */
exports.getSchemaKey = function getSchemaKey(method, path) {
  return `${ method.toUpperCase() } ${ path }`;
};

/**
 * 创建一个兼容 callback 的 Promise
 */
exports.createPromiseCallback = function createPromiseCallback() {
  const callback = (err, ret) => {
    if (err) {
      callback.reject(err);
    } else {
      callback.resolve(ret);
    }
  };
  callback.promise = new Promise((resolve, reject) => {
    callback.resolve = resolve;
    callback.reject = reject;
  });
  return callback;
};
