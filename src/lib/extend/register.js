'use strict';

/**
 * hojs
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

import assert from 'assert';
import Schema from '../schema';
import {getCallerSourceLine} from '../utils';
import {core as debug} from '../debug';

export default function () {

  this.api.override = {};

  /**
   * 注册API
   *
   * @param {String} method HTTP请求方法
   * @param {String} path 请求路径
   * @param {Boolean} strict 是否严格模式，严格模式下不允许重复注册相同的API，默认为`true`
   * @return {Object}
   */
  const register = (method, path, strict = true) => {

    const s = new Schema(method, path, getCallerSourceLine(this.config.get('api.path')));
    const s2 = this.api.$schemaMapping[s.key];

    if (strict) {
      assert(!s2, `尝试注册API：${s.key}（所在文件：${s.options.sourceFile.absolute}）失败，因为该API已在文件${s2 && s2.options.sourceFile.absolute}中注册过`);
    }

    if (s2) {
      removeSchemas(s.key);
      debug('override API: %s %s at %s', method, path, s.options.sourceFile.absolute);
    }

    this.api.$schemas.push(s);
    this.api.$schemaMapping[s.key] = s;
    return s;

  };

  const removeSchemas = (key) => {

    for (let i = 0; i < this.api.$schemas.length; i++) {
      const s = this.api.$schemas[i];
      if (s.key === key) {
        this.api.$schemas.splice(i, 1);
        i--;
      }
    }

  };

  for (const method of Schema.SUPPORT_METHOD) {
    this.api[method] = (path) => {
      return register(method, path, true);
    };
    this.api.override[method] = (path) => {
      return register(method, path, false);
    };
  }

};
