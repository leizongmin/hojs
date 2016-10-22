'use strict';

/**
 * hojs
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

const assert = require('assert');
const SuperMicroServices = require('super-microservices').Manager;

module.exports = class ServiceManager {

  constructor(parent) {
    this.parent = parent;
    assert.ok(parent, 'new ServiceManager(parent): parent不能为空!');
    this.services = new SuperMicroServices({
      logRecorder: parent.api.getOption('servicesLogRecorder'),
    });
  }

  /**
   * 注册服务
   *
   * @param {String} name
   * @param {Function} handler
   * @return {this}
   */
  register(name, handler) {
    assert.equal(name, name.trim(), `register(name, handler): 服务名称首尾不能包含空格`);
    assert.equal(typeof handler, 'function', `register(name, handler): 第二个参数必须为一个函数`);
    this.services.register(name, handler);
    return this;
  }

  /**
   * 调用服务
   *
   * @param {String} name
   * @param {Object} params
   * @param {Function} callback
   */
  call() {
    return this.services.call.apply(this.services, arguments);
  }

};
