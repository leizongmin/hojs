'use strict';

/**
 * hojs
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

const assert = require('assert');
const validator = require('validator');
const ProjectCore = require('project-core');

const debug = require('./debug').core;
const { mergeParams } = require('./utils');

const extendRegister = require('./extend/register');
const extendOption = require('./extend/option');
const extendOutput = require('./extend/output');
const extendTest = require('./extend/test');
const extendDocs = require('./extend/docs');

const HookManager = require('./manager/hook');
const ErrorManager = require('./manager/error');
const TypeManager = require('./manager/type');
const ServiceManager = require('./manager/service');

const registerDefaultErrors = require('./default/errors');
const registerDefaultTypes = require('./default/types');
const registerDefaultServices = require('./default/services');

const { serviceDebug, serviceInfo, serviceLog, serviceError } = require('./debug');
const { LoggerRecorder } = require('nanoservices');


/**
 * ProjectCore类
 */
module.exports = class Hojs extends ProjectCore {

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

    const engine = options.engine || 'express';
    const engineType = typeof engine;
    assert(engineType === 'string' || engineType === 'function', `engine参数必须为字符串或函数类型`);

    // 检查engine是否正确
    if (engineType === 'string') {
      try {
        this.ServerEngine = require(`hojs-${ engine }`);
      } catch (err) {
        console.error(err.stack);
        throw new Error(`无法加载引擎${ engine }，请检查是否正确安装了 hojs-${ engine } 模块`);
      }
      assert(typeof this.ServerEngine === 'function', `hojs-${ engine } 不是一个有效的引擎`);
    } else {
      this.ServerEngine = engine;
    }

    // 创建engine
    this.server = new this.ServerEngine(this);

    // 检查engine是否被正确实现
    // - constructor(parent)
    // - init(callback)
    // - listen(host, port, callback)
    // - getServerInstance() -> http.Server
    // - getMiddleware() -> app
    // - use(fn)
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
    this.api.$options = {};
    this.api.$flag = {
      saveApiInputOutput: false,
    };

    // 注册API相关
    extendRegister.call(this);

    // 配置选项相关
    extendOption.call(this);

    // 服务管理
    if (!this.api.getOption('servicesLogRecorder')) {
      const logger = {
        debug: serviceDebug,
        info: serviceInfo,
        log: serviceLog,
        error: serviceError,
      };
      this.api.setOption('servicesLogRecorder', new LoggerRecorder(logger, {
        format: '{"time":$isotime,"id":"$id","type":"$type","service":"$service","uptime":$uptime,"content":$content}',
        newline: '\n',
      }));
    }
    this.service = new ServiceManager(this);
    registerDefaultServices.call(this, this.service);

    // 钩子管理
    this.hook = new HookManager(this);

    // 参数类型管理
    this.type = new TypeManager(this);
    registerDefaultTypes.call(this, this.type);

    // 错误类型管理
    this.error = new ErrorManager(this);
    registerDefaultErrors.call(this, this.error);

    // 单元测试与文档生成相关的API
    extendOutput.call(this);
    extendTest.call(this);
    extendDocs.call(this);

    // init初始化任务
    {
      // 封装函数，使得适应super-microservice
      // super-microservice为 { schema, params }
      // 实际调用函数为 fn(params)
      // 并将结果作为super-microservice的返回值 { schema, params: ret }
      const wrapFn = (fn) => {
        assert(typeof fn === 'function', `wrapFn(fn): fn 必须是一个函数`);
        return (ctx) => {
          const cb = (err, ret) => {
            if (err) return ctx.error(err);
            const data = Object.assign({}, ctx.params);
            data.params = ret;
            ctx.result(data);
          };
          const p = fn(ctx.params.params, cb);
          if (this.utils.isPromise(p)) {
            p.then(ret => cb(null, ret)).catch(cb);
          }
        };
      };

      // 初始化hook
      this.api.$initTasks.push(() => {
        this.hook.forEach(fn => {
          this.service.register(`hook.${ fn.options.name }`, wrapFn(fn));
        });
      });

      // 初始化schema
      this.api.$initTasks.push(() => {
        for (const schema of this.api.$schemas) {
          schema.init(this);
          this.service.register(`handler.${ schema.key }`, wrapFn(schema.options.handler));
        }
      });

      // 初始化Web引擎
      this.api.$initTasks.push((done) => {
        this.server.init(done);
      });
    }
  }

  /**
   * 检查是否已初始化，如果已初始化则抛出异常
   *
   * @param {String} msg 描述
   */
  _checkInited(msg) {
    assert(this.inited === false, `系统已经初始化，不能再执行此操作${ msg ? '：' + msg : '' }`);
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

};
