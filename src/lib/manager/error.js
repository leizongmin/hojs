'use strict';

/**
 * hojs
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

import assert from 'assert';
import {core as debug} from '../debug';
import Manager from './manager';

export default class ErrorManager extends Manager{

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
  register(name, data = {}) {

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

    info.data = this.parent.utils.merge(data, {type: name});
    delete info.data.message;
    info.Error = this.parent.utils.customError(name, info.data);

    debug('register: %s %j', name, data);
    this.map.set(name, this.parent.utils.merge(info, {name}));

    return this;
  }

  /**
   * 创建指定错误类型
   *
   * @param {String} name 名称
   * @param {String} msg 描述
   * @param {Object} data 附加数据
   * @return {Object}
   */
  new(name, msg, data) {

    const info = this.map.get(name);
    assert(info, `unknown error type ${ name }`);

    return new info.Error(info.message(msg, data || {}), data);
  }

}
