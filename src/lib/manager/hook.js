'use strict';

/**
 * hojs
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

import assert from 'assert';
import {getCallerSourceLine} from '../utils';
import Manager from './manager';

export default class HookManager extends Manager{

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

    assert(!this.get(name), `钩子"${name}"已存在`);

    handler.options = {
      name,
      description,
      sourceFile: getCallerSourceLine(this.parent.config.get('api.path')),
    };
    this.map.set(name, handler);

    return this;
  }

};
