'use strict';

/**
 * hojs
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

const assert = require('assert');
const { getCallerSourceLine } = require('../utils');
const Manager = require('./manager');

module.exports = class HookManager extends Manager{

  /**
   * 注册 API 钩子
   *
   * @param {String} name
   * @param {Function} handler
   * @param {Function} description
   */
  register(name, handler, description) {

    assert(typeof name === 'string', `钩子名称必须为字符串类型`);
    assert(typeof handler === 'function', `钩子处理函数必须为函数类型`);

    assert(!this.get(name), `钩子"${ name }"已存在`);

    const handlerFn = handler;
    handlerFn.options = {
      name,
      description,
      sourceFile: getCallerSourceLine(this.parent.config.get('api.path')),
    };
    this.map.set(name, handlerFn);

    return this;
  }

};
