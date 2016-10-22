'use strict';

/**
 * hojs
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

const fs = require('fs');
const util = require('util');
const assert = require('assert');
const request = require('supertest');
const utils = require('lei-utils');
const createDebug = require('./debug').create;
const debug = require('./debug').test;

/* 支持的HTTP请求方法 */
const SUPPORT_METHOD = [ 'get', 'post', 'put', 'delete' ];

/* 输出结果断言错误 */
const AssertionError = utils.customError('AssertionError', { type: 'api_output_error' });

/* 空回调函数 */
const noop = () => {};

/**
 * 返回对象结构字符串
 *
 * @param {Object} obj
 * @return {String}
 */
function inspect(obj) {
  return util.inspect(obj, {
    depth: 5,
    colors: true,
  });
}

/**
 * 测试代理类
 */
const TestAgent = module.exports = class TestAgent {

  /**
   * 构造函数
   *
   * @param {String} method HTTP请求方法
   * @param {String} path 请求路径
   * @param {String} key 键名：`method path`
   * @param {Object} sourceFile 源文件路径描述对象
   * @param {Object} parent hojs实例
   */
  constructor(method, path, key, sourceFile, parent) {
    assert(method && typeof method === 'string', '`method` must be string');
    assert(TestAgent.SUPPORT_METHOD.indexOf(method.toLowerCase()) !== -1, '`method` must be one of ' + TestAgent.SUPPORT_METHOD);
    assert(path && typeof path === 'string', '`path` must be string');
    assert(path[0] === '/', '`path` must be start with "/"');
    this.options = {
      parent,
      sourceFile,
      method: method.toLowerCase(),
      path,
      agent: null,
    };
    this.key = key;
    this._extendsOutput();
    this.debug = createDebug(`agent:${ this.key }`);
    this.debug('new: %s %s from %s', method, path, sourceFile.absolute);
  }

  /**
   * 设置`supertest.Agent`实例
   *
   * @param {Object} agent
   */
  setAgent(agent) {
    this.options.agent = agent;
  }

  /**
   * 初始化`supertest.Agent`实例
   *
   * @param {Object} app Express实例
   */
  initAgent(app) {
    assert(app, `express app instance could not be empty`);
    this.debug('create supertest agent');
    this.setAgent(request(app)[this.options.method](this.options.path));
  }

  /**
   * 获取测试代理
   *
   * @param {Boolean} rawSupertest `true`表示返回`supertest.Agent`实例，`false`返回`TestAgent`实例
   */
  agent(rawSupertest = false) {
    debug('agent: rawSupertest=%s', rawSupertest);
    if (rawSupertest) {
      return this.options.agent;
    }
    return this;
  }

  /**
   * 输入参数
   *
   * @param {Object} data
   * @return {Object}
   */
  input(data) {
    this.debug('input: %j', data);
    if (this.options.method === 'get' || this.options.method === 'head') {
      this.options.agent.query(data);
    } else {
      for (const i in data) {
        if (data[i] instanceof fs.ReadStream) {
          this.options.agent.attach(i, data[i]);
        } else {
          this.options.agent.field(i, data[i]);
        }
      }
    }
    return this;
  }

  /**
   * 输出结果
   *
   * @param {Function} callback
   */
  output(callback) {
    const self = this;
    const cb = callback || noop;
    return new Promise((resolve, reject) => {
      self.options.agent.end((err, res) => {
        if (err) {
          cb(err);
          reject(err);
          return;
        }
        const formatOutputReverse = self.options.parent.api.getOption('formatOutputReverse');
        const [ err2, ret ] = formatOutputReverse(res.body);
        cb(err2, ret);
        err2 ? reject(err2) : resolve(ret);
      });
    });
  }

  _extendsOutput() {

    /**
     * 期望输出成功结果
     *
     * @param {Function} callback
     */
    this.output.success = (callback) => {
      const cb = callback || noop;
      return new Promise((resolve, reject) => {
        this.output((err, ret) => {
          if (err) {
            const err2 = new AssertionError(`${ this.key } 期望API输出成功结果，但实际输出失败结果：${ inspect(err) }`);
            cb(err2);
            reject(err2);
          } else {
            cb(null, ret);
            resolve(ret);
          }
        });
      });
    };

    /**
     * 期望输出失败结果
     *
     * @param {Function} callback
     */
    this.output.error = (callback) => {
      const cb = callback || noop;
      return new Promise((resolve, reject) => {
        this.output((err, ret) => {
          if (err) {
            cb(null, err);
            resolve(err);
          } else {
            const err2 = new AssertionError(`${ this.key } 期望API输出失败结果，但实际输出成功结果：${ inspect(ret) }`);
            cb(err2);
            reject(err2);
          }
        });
      });
    };

  }

};

/* 支持的HTTP请求方法 */
TestAgent.SUPPORT_METHOD = SUPPORT_METHOD;
