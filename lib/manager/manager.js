'use strict';

/**
 * hojs
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

module.exports = class Manager {

  constructor(parent) {
    this.parent = parent;
    this.map = new Map();
  }

  /**
   * 获取
   *
   * @param {String} name
   * @return {Object}
   */
  get(name) {
    return this.map.get(name);
  }

  /**
   * 遍历
   *
   * @param {Function} iter
   */
  forEach(iter) {
    return this.map.forEach(iter);
  }

};
