'use strict';

/**
 * hojs
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

const assert = require('assert');
const supertest = require('supertest');
const { getCallerSourceLine, getSchemaKey } = require('../utils');
const debug = require('../debug').test;
const TestAgent = require('../test_agent');

module.exports = function extendTest() {

  this.test = {};

  /**
   * 根据请求方法和请求路径查找对应的schema
   *
   * @param {String} method
   * @param {String} path
   * @return {Object}
   */
  const findSchema = (method, path) => {

    const key = getSchemaKey(method, path);

    // 检查path无变量情况
    if (this.api.$schemaMapping[key]) return this.api.$schemaMapping[key];

    // 检查path有变量情况
    for (const key in this.api.$schemaMapping) {
      const s = this.api.$schemaMapping[key];
      if (s.pathTest(method, path)) {
        return s;
      }
    }
  };

  // test.get, this.post, ...
  for (const method of TestAgent.SUPPORT_METHOD) {
    this.test[method] = (path, rawSupertest) => {

      const s = findSchema(method, path);
      assert(s, `尝试请求未注册的API：${ method } ${ path }`);
      const a = new TestAgent(method, path, s.key, getCallerSourceLine(this.config.get('api.path')), this);

      a.initAgent(this.server.getServerInstance());
      return a.agent(rawSupertest);

    };
  }

  /**
   * 创建测试会话
   *
   * @return {Object}
   */
  this.test.session = () => {

    const session = {};
    session.$$agent = supertest.agent(this.server.getServerInstance());

    for (const method of TestAgent.SUPPORT_METHOD) {
      session[method] = (path, rawSupertest) => {

        const s = findSchema(method, path);
        assert(s, `尝试请求未注册的API：${ method } ${ path }`);
        const a = new TestAgent(method, path, s.key, getCallerSourceLine(this.config.get('api.path')), this);

        a.setAgent(session.$$agent[method](path));
        return a.agent(rawSupertest);

      };
    }

    return session;

  };

  /**
   * 测试分组（相当于macha中的`describe()`）
   *
   * @param {String} name
   * @param {Function} init
   */
  this.test.describe = (name, init) => {

    assert(name, '名称不能为空');
    assert(typeof name === 'string', `名称必须为字符串类型，但实际为${ name }(${ typeof name })`);
    assert(typeof init === 'function', `测试初始化函数必须为函数类型，但实际为${ name }(${ typeof name })`);

    assert(typeof describe === 'function', `describe()函数不存在，请确定是否使用了mocha来执行此文件`);
    assert(typeof before === 'function', `before()函数不存在，请确定是否使用了mocha来执行此文件`);
    assert(typeof after === 'function', `after()函数不存在，请确定是否使用了mocha来执行此文件`);

    describe(name, () => {

      before(done => {
        debug('test describe before: %s', name);
        this.ready(err => {
          if (err) {
            debug('test describe not ready: %s', err);
          } else {
            debug('test describe ready: %s', name);
          }
          done(err);
        });
      });

      after(done => {
        debug('test describe after: %s', name);
        done();
      });

      debug('test describe init: %s', name);
      init();

    });

  };

};
