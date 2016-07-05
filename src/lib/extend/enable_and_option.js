'use strict';

/**
 * hojs
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

import assert from 'assert';
import {core as debug} from '../debug';

export default function () {

  /**
   * 开启预设的功能（仅未初始化时有效）
   *
   * @param {String} name1 功能名称1
   * @param {String} name2 功能名称2（可多个）
   * @return {Object}
   */
  this.api.enable = (...list) => {
    this._checkInited(`enable(${list})`);
    for (const name of list) {
      assert(name in this.api.$features, `cannot enable unknown feature "${name}"`);
      this.api.$features[name] = true;
    }
    return this.api;
  };

  /**
   * 关闭预设的功能（仅未初始化时有效）
   *
   * @param {String} name1 功能名称1
   * @param {String} name2 功能名称2（可多个）
   * @return {Object}
   */
  this.api.disable = (...list) => {
    this._checkInited(`disable(${list})`);
    for (const name of list) {
      assert(name in this.api.$features, `cannot disable unknown feature "${name}"`);
      this.api.$features[name] = false;
    }
    return this.api;
  };

  /**
   * 检查预设功能是否已开启
   *
   * @param {String} name 功能名称
   * @return {Boolean}
   */
  this.api.isEnable = (name) => {
    return this.api.$features[name];
  };

  /**
   * 设置选项
   *
   * @param {String} name 名称
   * @param {Mixed} value 值
   * @return {Object}
   */
  this.api.setOption = (name, value) => {
    this.api.$options[name] = value;
    return this.api;
  };

  /**
   * 获取选项
   *
   * @param {String} name 名称
   * @return {Mixed}
   */
  this.api.getOption = (name) => {
    return this.api.$options[name];
  };

};
