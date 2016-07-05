'use strict';

/**
 * hojs
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

import assert from 'assert';
import registerDefaultTypes from '../default/types';
import {core as debug} from '../debug';

export default function () {

  /**
   * 获取参数类型
   *
   * @param {String} name
   * @return {Object}
   */
  this.api.getType = (name) => {
    return this.api.$types[name];
  };

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
  this.api.registerType = (name, {checker, formatter, parser, paramsChecker, description = '', isDefault} = {}) => {

    isDefault = !!isDefault;

    assert(name && typeof name === 'string', '参数名称必须是字符串类型');
    assert(/^[A-Z]/.test(name[0]), `参数名称必须以大写字母开头：${name}`);
    assert(!(name in this.api.$types), `该参数已被注册：${name}`);

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

    this.api.$types[name] = {checker, formatter, parser, paramsChecker, description, isDefault};

    if (!isDefault) {
      debug('register type: name=%s, checker=%s, formatter=%s, paramsChecker=%s description=%s',
        name, checker, formatter, paramsChecker, description);
    }

    return this.api;
  };

  // 注册内置参数类型
  registerDefaultTypes(this.api.registerType);

};