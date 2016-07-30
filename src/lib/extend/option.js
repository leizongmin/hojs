'use strict';

/**
 * hojs
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

export default function () {

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

}
