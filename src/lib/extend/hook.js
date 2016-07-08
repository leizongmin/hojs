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

  /**
   * 注册 API 钩子
   *
   * @param {String} name
   * @param {Function} handler
   */
  this.api.registerHook = (name, handler) => {

    assert(typeof name === 'stirng', `钩子名称必须为字符串类型`);
    assert(typeof handler === 'function', `钩子处理函数必须为函数类型`);

    assert(!this.api.$hooks[name], `钩子"${name}"已存在`);

    this.api.$hooks[name] = handler;

    return this.api;
  };

};
