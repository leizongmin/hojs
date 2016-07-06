'use strict';

/**
 * hojs engine - express
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

import assert from 'assert';
import http from 'http';
import express from 'express';
import bodyParser from 'body-parser';
import multiparty from 'connect-multiparty';
import {mergeParams} from '../../utils';
import {express as debug} from '../../debug';

/**
 * 创建一个Express Router
 *
 * @return {Object}
 */
function createRouter() {
  return express.Router({
    caseSensitive: true,
    mergeParams: true,
    strict: true,
  });
}

/**
 * 基于Express的Web服务器引擎
 */
export default class ExpressEngine {

  /**
   * 构造函数
   *
   * @param {Object} parent Hojs实例
   */
  constructor(parent) {
    this.parent = parent;
    this.$express = {};
    this.$express.app = express();
    this.$express.apiRouter = createRouter();
    this.$express.app.use(this.$express.apiRouter);
    this.$server = http.createServer(this.$express.app);
  }

  /**
   * 初始化
   *
   * @param {Function} callback 回调函数
   */
  init(callback) {
    debug('initing');

    const app = this.$express.app;
    const apiRouter = this.$express.apiRouter;

    // 格式化API输出结果并响应
    const formatOutput = this.parent.api.getOption('formatOutput');
    const processOutput = (err, ret, req, res, next) => {

      let data = null;
      try {
        data = formatOutput(err, ret);
      } catch (err) {
        return next(err);
      }
      res.json(data);

      // 如果开启了saveApiInputOutput标记，则将当前输入输出数据作为样例添加到schema中
      if (this.parent.api.$flag.saveApiInputOutput && req.schema) {
        req.schema._addExample({
          input: req.apiParams,
          output: data,
        });
      }
    };

    // 合并请求参数
    const mergeApiParams = (req, res, next) => {
      req.apiParams = mergeParams(
        req.query,
        req.body,
        req.files,
        req.params,
        this.parent.api.isEnable('inputCookies') ? {$cookies: req.cookies || {}} : null,
        this.parent.api.isEnable('inputHeaders') ? {$headers: req.headers || {}} : null,
        this.parent.api.isEnable('inputSession') ? {$session: req.session || {}} : null,
        req.apiParams
      );
      next();
    };

    // 处理结果钩子
    const hookOutput = (err, ret, req, res, next) => {
      if (ret) {
        try {
          for (const fn of this.parent.api.$hookOutputs) {
            ret = fn(ret, req, res);
          }
        } catch (err) {
          return res.apiOutput(err, ret);
        }
      }
      res.apiOutput(err, ret);
    };

    // 封装API调用
    const wrapApiCall = (name) => {
      return (req, res, next) => {
        debug('api call: %s params=%j', name, req.apiParams);
        let p = null;
        try {
          p = this.parent.method(name).call(req.apiParams);
        } catch (err) {
          return hookOutput(err, undefined, req, res, next);
        }
        p.then(ret => hookOutput(null, ret, req, res, next));
        p.catch(err => hookOutput(err, undefined, req, res, next));
      };
    };

    //--------------------------------------------------------------------------

    // 如果开启了outputHeaders，注册headers钩子
    if (this.parent.api.isEnable('outputHeaders')) {
      this.parent.api.hookOutput((ret, req, res) => {
        if (ret.$headers) {
          // example: $headers: {'content-type': 'text/html'}
          for (const i in ret.$headers) {
            res.setHeader(i, ret.$headers[i]);
          }
          delete ret.$headers;
        }
        return ret;
      });
    }

    // 如果开启了outputCookies，注册cookies钩子
    if (this.parent.api.isEnable('outputCookies')) {
      this.parent.api.hookOutput((ret, req, res) => {
        if (ret.$cookies) {
          // example: $cookies: {name: [value, options]}
          for (const i in ret.$cookies) {
            assert(Array.isArray(ret.$cookies[i]), `$cookies.${i} must be array: [value, options]`);
            res.cookie(i, ...ret.$cookies[i]);
          }
          delete ret.$cookies;
        }
        if (ret.$removeCookies) {
          // example: $removeCookies: ['name1', 'name2']
          for (const n of ret.$removeCookies) {
            res.clearCookie(n);
          }
          delete ret.$removeCookies;
        }
        return ret;
      });
    }

    // 如果开启了outputSession，注册session钩子
    if (this.parent.api.isEnable('outputSession')) {
      this.parent.api.hookOutput((ret, req, res) => {
        if (ret.$session) {
          // example: $session: {name: value}
          for (const i in ret.$session) {
            req.session[i] = ret.$session[i];
          }
          delete ret.$session;
        }
        if (ret.$removeSession) {
          // example: $removeSession: ['name1', 'name2']
          for (const n of ret.$removeSession) {
            delete req.session[n];
          }
          delete ret.$removeSession;
        }
        return ret;
      })
    }

    //--------------------------------------------------------------------------

    // 扩展res.apiOutput()
    apiRouter.use((req, res, next) => {
      req.apiParams = {};
      res.apiOutput = (err, ret) => {
        debug('apiOutput: err=%j, ret=%j', (err && err.stack || err), ret);
        processOutput(err, ret, req, res, next);
      };
      debug('new api request: [%s] %s', req.method, req.url);
      next();
    });

    // 支持POST Body类型
    if (this.parent.api.isEnable('json')) {
      debug('enable feature: json');
      apiRouter.use(bodyParser.json());
    }
    if (this.parent.api.isEnable('urlencoded')) {
      debug('enable feature: urlencoded');
      apiRouter.use(bodyParser.urlencoded({extended: false}));
    }
    if (this.parent.api.isEnable('multipart')) {
      debug('enable feature: multipart');
      apiRouter.use(multiparty());
    }

    // 引入全局注册的中间件
    debug('init api global middlewares: %s', this.parent.api.$middlewares.length);
    for (const item of this.parent.api.$middlewares) {
      apiRouter.use(this.wrapMiddleware(item));
    }

    // 开始注册API
    debug('register schemas: %s', this.parent.api.$schemas.length);
    for (const schema of this.parent.api.$schemas) {

      const register = apiRouter[schema.options.method].bind(apiRouter);

      // 注册获取schema中间件
      register(schema.options.path, (req, res, next) => {
        req.schema = schema;
        next();
      });

      // 注册合并参数中间件
      register(schema.options.path, mergeApiParams);

      // 注册API引用的中间件
      if (schema.options.middlewares.length > 0) {
        const middlewares = schema.options.middlewares.map(name => {
          const fn = this.parent.api.getMiddleware(name);
          return this.wrapMiddleware(fn);
        });
        register(schema.options.path, ...middlewares);
        debug('register api middlewares: %s size=%s [%s] %s', schema.name, middlewares.length, schema.options.method, schema.options.path);
      }

      // API调用
      register(schema.options.path, wrapApiCall(schema.name));
      debug('register api route: %s [%s] %s', schema.name, schema.options.method, schema.options.path);
    }

    // 捕捉出错信息
    apiRouter.use((err, req, res, next) => {
      debug('api error: %j', err && err.stack || err);
      processOutput(err, null, req, res, next);
    });

    callback();
  }

  /**
   * 监听端口
   *
   * @param {String} host 主机地址
   * @param {Number} port 端口
   * @param {Function} callback 回调函数
   */
  listen(host, port, callback) {
    host = host || '127.0.0.1';
    debug('listen: host=%s, port=%s', host, port);

    this.getServerInstance().listen(port, host, err => {
      debug('listen callback: err=%s', err);
      callback(err);
    });
  }

  /**
   * 返回原始的http.Server实例
   *
   * @return {Object}
   */
  getServerInstance() {
    return this.$server;
  }

  /**
   * 封装中间件
   *
   * @param {Function} fn
   * @return {Function}
   */
  wrapMiddleware(fn) {
    assert(typeof fn === 'function', `express中间件必须是一个函数类型`);
    assert(fn.length >= 2, `express中间件必须至少有2个参数`);
    if (fn.length === 2) {
      return function (req, res, next) {
        let p = null;
        try {
          p = fn(req, res);
        } catch (err) {
          return next(err);
        }
        p.then(ret => next());
        p.catch(err => next(err));
      };
    } else {
      return fn;
    }
  }

}
