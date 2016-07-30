'use strict';

/**
 * hojs
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

import assert from 'assert';
import { core as debug } from '../debug';

export default function () {

  const IS_DEFAULT = Symbol('is default');

  /**
   * 设置格式化输出结果的函数
   *
   * @param {Function} fn 函数格式：`function (err, data) { return data; }`
   * @return {Object}
   */
  this.api.formatOutput = (fn) => {

    assert(typeof fn === 'function', 'formatOutput函数必须为函数类型');
    assert(fn.length === 2, 'formatOutput函数必须有两个参数');

    // 检查注册的formatOutput函数在失败情况下是否能正常工作
    try {
      fn(new Error('test formatOutput'));
    } catch (err) {
      throw new Error(`测试formatOutput(err)失败：${ err.stack }`);
    }

    // 检查注册的formatOutput函数在成功情况下是否能正常工作
    try {
      fn(null, { ok: true });
    } catch (err) {
      throw new Error(`测试formatOutput(null, data)失败：${ err.stack }`);
    }

    this.api.setOption('formatOutput', fn);

    return this.api;
  };

  /* 默认的格式化输出函数 */
  const defaultFormatOutput = (err, ret) => {

    if (err) {
      const ret = { error: {}};
      if (err instanceof Error) {
        ret.status = ret.status || err.status || -1;
        ret.message = err.message;

        for (const n in err) {
          if (n === 'status' || n === 'message') continue;
          ret.error[n] = err[n];
        }
      } else {
        ret.status = -1;
        ret.message = ret.toString();
      }
      return ret;
    }

    return { status: 0, result: ret };
  };

  // 注册默认的formatOutput
  defaultFormatOutput[IS_DEFAULT] = true;
  this.api.formatOutput(defaultFormatOutput);

  /**
   * 设置反转格式化输出结果的函数（当自定义了`formatOutput`时必须注册对应的`formatOutputReverse`，且自定义了`formatOutput`必须先注册）
   *
   * @param {Function} fn 函数格式：`function (data) { return [err, data]; }`
   * @return {Object}
   */
  this.api.formatOutputReverse = (fn) => {

    assert(typeof fn === 'function', 'formatOutputReverse函数必须是函数类型');
    assert(fn.length === 1, 'formatOutputReverse函数必须有1个参数');

    const formatOutput = this.api.getOption('formatOutput');

    // 检查注册的formatOutputReverse函数在失败情况下是否能正常工作
    try {
      fn(formatOutput(new Error('test formatOutput')));
    } catch (err) {
      throw new Error(`测试formatOutputReverse(err)失败：${ err.stack }`);
    }

    // 检查注册的formatOutputReverse函数在成功情况下是否能正常工作
    try {
      const ret = fn(formatOutput(null, { ok: true }));
      assert(Array.isArray(ret) && ret.length === 2, `formatOutputReverse(null, data)必须返回一个包含2个元素的数组`);
      assert(ret[0] === null, `formatOutputReverse(null, data)如果没有出错，返回数组结果的第一个元素值必须为null`);
    } catch (err) {
      throw new Error(`测试formatOutputReverse(null, data)失败：${ err.stack }`);
    }

    this.api.setOption('formatOutputReverse', fn);

    return this.api;
  };

  /* 默认的反转格式化输出函数 */
  const defaultFormatOutputReverse = (data) => {
    if (data.status === 0) {
      return [ null, data.result ];
    }
    return [ data ];
  };

  // 注册默认的formatOutputReverse
  defaultFormatOutputReverse[IS_DEFAULT] = true;
  this.api.formatOutputReverse(defaultFormatOutputReverse);

  /**
   * 注册处理输出结果的钩子
   *
   * @param {Function} fn 函数格式：`function (data) { return data; }`
   */
  this.api.hookOutput = (fn) => {
    assert(typeof fn === 'function', '钩子函数必须是函数类型');
    assert(typeof fn({}) !== 'undefined', '钩子函数必须返回一个对象');
    debug('hookOutput: %s', fn);
    this.api.$hookOutputs.push(fn);
  };

}
