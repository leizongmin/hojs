'use strict';

/**
 * hojs
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

import assert from 'assert';
import { Manager as SuperMicroServices, LoggerRecorder } from 'super-microservices';
import { serviceDebug, serviceInfo, serviceLog, serviceError } from '../debug';

export default class ServiceManager {

  constructor(parent) {
    this.parent = parent;
    assert.ok(parent, 'new ServiceManager(parent): parent不能为空!');
    const logger = {
      debug: serviceDebug,
      info: serviceInfo,
      log: serviceLog,
      error: serviceError,
    };
    this.services = new SuperMicroServices({ logRecorder: new LoggerRecorder(logger) });
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

}
