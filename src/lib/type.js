'use strict';

/**
 * hojs
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

import assert from 'assert';
import {core as debug} from './debug';

export default class TypeManager {

  constructor(parent) {
    this.parent = parent;
    this.map = new Map();
  }

  /**
   * 获取参数类型
   *
   * @param {String} name
   * @return {Object}
   */
  get(name) {
    return this.map.get(name);
  };

  /**
   * 遍历注册的错误类型
   *
   * @param {Function} iter
   */
  forEach(iter) {
    return this.map.forEach(iter);
  }

  /**
   * 注册参数类型
   *
   * 参数检查工作流程：
   *
   * ```
   * data = parser(data);
   * if (!checker(data, checkerParams)) throw new Error('检查参数失败');
   * data = formatter(data);
   * ```
   *
   * @param {String} name
   * @param {Object}
   *   - {Function} checker 参数检查器，函数格式：`function (v, params) { return true; }`
   *   - {Function} formatter 参数格式化，函数格式：`function (v) { return v; }`
   *   - {Function} parser 参数解析，函数格式：`function (v) { return v; }`
   *   - {Function} paramsChecker 参数检查器的参数检查，函数格式：`function (params) { return true; }`
   *   - {String} description 参数描述（用于文档生成）
   *   - {Boolean} isDefault 是否为默认参数
   * @return {Object}
   */
  register(name, {checker, formatter, parser, paramsChecker, description = '', isDefault} = {}) {

    isDefault = !!isDefault;

    assert(name && typeof name === 'string', '参数名称必须是字符串类型');
    assert(/^[A-Z]/.test(name[0]), `参数名称必须以大写字母开头：${name}`);
    assert(!this.get(name), `该参数已被注册：${name}`);

    assert(typeof description === 'string', '参数描述必须是字符串类型');

    assert(checker && typeof checker === 'function', 'checker必须是函数类型');

    if (formatter) {
      assert(typeof formatter === 'function', 'formatter必须是函数类型');
    } else {
      formatter = null;
    }

    if (parser) {
      assert(typeof parser === 'function', 'parser必须是函数类型');
    } else {
      parser = null;
    }

    if (paramsChecker) {
      assert(typeof paramsChecker === 'function', 'paramsChecker必须是函数类型');
    } else {
      paramsChecker = null;
    }

    this.map.set(name, {name, checker, formatter, parser, paramsChecker, description, isDefault});

    if (!isDefault) {
      debug('register type: name=%s, checker=%s, formatter=%s, paramsChecker=%s description=%s',
        name, checker, formatter, paramsChecker, description);
    }

    return this;
  }

}
