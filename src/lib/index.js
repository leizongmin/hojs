'use strict';

/**
 * hojs
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

import assert from 'assert';
import validator from 'validator';
import ProjectCore from 'project-core';

import {core as debug} from './debug';
import {mergeParams} from './utils';

import extendRegister from './extend/register';
import extendOption from './extend/option';
import extendMiddleware from './extend/middleware';
import extendOutput from './extend/output';
import extendTest from './extend/test';
import extendDocs from './extend/docs';

import HookManager from './manager/hook';
import ErrorManager from './manager/error';
import TypeManager from './manager/type';

import registerDefaultErrors from './default/errors';
import registerDefaultTypes from './default/types';


/**
 * ProjectCore类
 */
export default class Hojs extends ProjectCore {

  /**
   * 构造函数
   *
   * @param {Object} options
   *   - {String} path API项目路径
   *   - {String|Function} engine Web引擎，如果为字符串，则加载`express-${name}`
   */
  constructor(options) {
    super();

    this.inited = false;
    this.validator = validator;
    this.config.set('api.path', options.path || process.cwd());

    options.engine = options.engine || 'express';
    const engineType = typeof options.engine;
    assert(engineType === 'string' || engineType === 'function', `engine参数必须为字符串或函数类型`);

    // 检查engine是否正确
    if (engineType === 'string') {
      try {
        this.ServerEngine = require(`hojs-${options.engine}`);
      } catch (err) {
        console.error(err.stack);
        throw new Error(`无法加载引擎${options.engine}，请检查是否正确安装了 hojs-${options.engine} 模块`);
      }
      assert(typeof this.ServerEngine === 'function', `hojs-${options.engine} 不是一个有效的引擎`);
    } else {
      this.ServerEngine = options.engine;
    }

    // 创建engine
    this.server = new this.ServerEngine(this);

    // 检查engine是否被正确实现
    // constructor(parent)
    // init(callback)
    // listen(host, port, callback)
    // getServerInstance() -> http.Server
    // getMiddleware() -> app
    // use(fn)
    assert(typeof this.server.init, `engine没有实现init(callback)方法`);
    assert(typeof this.server.listen, `engine没有实现listen(host, port, callback)方法`);
    assert(typeof this.server.getServerInstance, `engine没有实现getServerInstance()方法`);
    assert(typeof this.server.getMiddleware, `engine没有实现getMiddleware()方法`);
    assert(typeof this.server.use, `engine没有实现use(fn)方法`);

    this._extendApi();
  }

  /**
   * 初始化
   */
  _extendApi() {

    this.utils.merge = mergeParams;

    this.api = {};
    this.api.$initTasks = [];
    this.api.$schemas = [];
    this.api.$schemaMapping = {};
    this.api.$hookOutputs = [];
    this.api.$middlewares = [];
    this.api.$middlewaresMapping = {};
    this.api.$options = {};
    this.api.$flag = {
      saveApiInputOutput: false,
    };


    extendRegister.call(this);
    extendOption.call(this);
    extendMiddleware.call(this);

    // 钩子管理
    this.hook = new HookManager(this);

    // 参数类型管理
    this.type = new TypeManager(this);
    registerDefaultTypes(this.type);

    // 错误类型管理
    this.error = new ErrorManager(this);
    registerDefaultErrors(this.error);

    extendOutput.call(this);
    extendTest.call(this);
    extendDocs.call(this);

    // 初始化schema
    this.api.$initTasks.push(() => {
      for (const schema of this.api.$schemas) {
        const {name, handler, before, after} = schema.init(this);
        for (const fn of before) {
          this.method(name).before(fn);
        }
        for (const fn of after) {
          this.method(name).after(fn);
        }
        this.method(name).register(handler);
      }
    });

    // 初始化Web引擎
    this.api.$initTasks.push((done) => {
      this.server.init(done);
    });

  }

  /**
   * 检查是否已初始化，如果已初始化则抛出异常
   *
   * @param {String} msg 描述
   */
  _checkInited(msg) {
    assert(this.inited === false, `系统已经初始化，不能再执行此操作${msg ? '：' + msg : ''}`);
  }

  /**
   * 初始化
   *
   * @param {Function} callback
   */
  init(callback) {
    debug('init');

    super.init(err => {
      if (err) return callback && callback(err);

      this.utils.runSeries(this.api.$initTasks, this, (err) => {
        debug('ready: err=%s', err);
        this.inited = true;

        if (err) {
          this.event.emit('error', err);
          return callback && callback(err);
        }

        callback && callback(err);
      });
    });

  }

  /**
   * 监听端口
   *
   * @param {String} host
   * @param {Number} port
   * @param {Function} callback
   * @return {Object}
   */
  listen(host, port, callback) {
    this.server.listen(host, port, callback);
    return this;
  }

  /**
   * 初始化并监听端口
   *
   * @param {String} host
   * @param {Number} port
   * @param {Function} callback
   * @return {Object}
   */
  initAndListen(host, port, callback) {
    this.init(err => {
      if (err) return callback(err);

      this.listen(host, port, callback);
    });
    return this;
  }

}
