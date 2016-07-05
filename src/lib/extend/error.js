'use strict';

/**
 * hojs
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

import assert from 'assert';
import registerDefaultErrors from '../default/errors';
import {core as debug} from '../debug';

export default function () {

  /**
   * 注册错误类型
   *
   * @param {String} name 名称（一般为英文字母）
   * @param {Object} data 数据
   *   - {String|Number} status 错误代码
   *   - {String} message 错误描述
   *   - {String} description 错误详细信息（用于生成文档）
   * @return {Object}
   */
  this.api.registerError = (name, data = {}) => {

    assert(typeof name === 'string', 'error name must be string');
    assert(data && typeof data === 'object', 'second argument must be object');
    assert(data.status, 'missing option `status`');

    const info = {};

    if (data.message) {
      assert(typeof data.message === 'string' || typeof data.message === 'function', 'option `message` must be function or string');
      info.message = data.message;
      if (typeof info.message !== 'function') {
        const msg = info.message;
        info.message = () => msg;
      }
    } else {
      info.message = (msg) => msg;
    }

    if (data.description) {
      assert(typeof data.description, 'option `description` must be string');
    }

    info.data = this.utils.merge(data, {type: name});
    delete info.data.message;
    info.Error = this.utils.customError(name, info.data);

    debug('registerError: %s %j', name, data);
    this.api.$errors[name] = info;

    return this.api;
  };

  /**
   * 创建指定错误类型
   *
   * @param {String} name 名称
   * @param {String} msg 描述
   * @param {Object} data 附加数据
   * @return {Object}
   */
  this.api.error = (name, msg, data) => {

    assert(this.api.$errors[name], `unknown error type ${name}`);

    const info = this.api.$errors[name];
    msg = info.message(msg, data || {});

    const err = new info.Error(msg, data);

    return err;
  };

  // 注册默认的错误类型
  registerDefaultErrors(this.api.registerError);

};
