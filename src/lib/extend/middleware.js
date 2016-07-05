'use strict';

/**
 * hojs
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

import assert from 'assert';
import {wrapAsyncMiddleware, getCallerSourceLine} from '../utils';
import {core as debug} from '../debug';

export default function () {

  this.api.use = (...list) => {
    for (const fn of list) {
      this.api.$express.middlewares.push(this._getApiMiddleware(fn));
    }
  };

  /**
   * 注册中间件
   *
   * @param {String} name 中间件名称（一般为英文字母）
   * @param {Function} fn 中间件函数
   * @param {String} description 描述信息（用于文档生成）
   * @return {Object}
   */
  this.api.registerMiddleware = (name, fn, description) => {

    assert(typeof name === 'string', '中间件名称必须为字符串类型');
    assert(typeof fn === 'function', '中间件函数必须为函数类型');
    assert(fn.length === 2 || fn.length === 3, '中间件函数必须有3个参数，格式为：`function (req, res, next)`或者2个函数，格式为：`async function (req, res)`');
    assert(!this.api.$middlewaresMapping[name], `中间件"${name}"已经存在`);

    this.api.$middlewaresMapping[name] = wrapAsyncMiddleware(fn);
    this.api.$middlewaresMapping[name].options = {
      origin: fn,
      sourceFile: getCallerSourceLine(this.config.get('api.path')),
      description: description || null,
    };

    return this.api;
  };

};
