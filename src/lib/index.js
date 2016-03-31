'use strict';

/**
 * hojs
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

import {resolve as resolvePath} from 'path';
import assert from 'assert';
import express from 'express';
import multiparty from 'connect-multiparty';
import bodyParser from 'body-parser';
import validator from 'validator';
import ProjectCore from 'project-core';
import Schema from './schema';
import registerDefaultTypes from './default_types';
import registerDefaultErrors from './default_errors';
import {core as debug} from './debug';


function getCallerSourceLine(dir) {
  dir = resolvePath(dir);
  const stack = (new Error()).stack.split('\n').slice(1);
  for (let line of stack) {
    line = line.trim();
    if (line.replace(/\\/g, '/').indexOf(dir) !== -1) {
      const s = line.match(/\((.*)\)\s*$/);
      if (s) {
        return {
          relative: s[1].slice(dir.length + 1),
          absolute: s[1],
        };
      }
    }
  }
  return {relative: null, absolute: null};
}

function createRouter() {
  return express.Router({
    caseSensitive: true,
    mergeParams: true,
    strict: true,
  });
}

function mergeParams(...list) {
  const ret = {};
  for (const item of list) {
    if (item && typeof item === 'object') {
      for (const i in item) {
        ret[i] = item[i];
      }
    }
  }
  return ret;
}


export default class Hojs extends ProjectCore {

  constructor(options) {
    super();
    this.validator = validator;
    this.config.set('api.path', options.path || process.cwd());
    this._extendsApi();
  }

  _extendsApi() {

    this.utils.merge = mergeParams;

    this.api = {};
    this.api.$initTasks = [];
    this.api.$schemas = [];
    this.api.$schemaMapping = {};
    this.api.$types = {};
    this.api.$errors = {};
    this.api.$express = {};
    this.api.$express.app = null;
    this.api.$express.apiRouter = null;
    this.api.$express.sysRouter = null;
    this.api.$express.middlewares = [];
    this.api.$options = {};
    this.api.$features = {
      multipart: true,
      urlencoded: true,
      json: true,
      redisSession: false,
    };

    for (const method of Schema.SUPPORT_METHOD) {
      this.api[method] = (path) => {
        const s = new Schema(method, path, getCallerSourceLine(this.config.get('api.path')));
        const s2 = this.api.$schemaMapping[s.key];
        assert(!s2, `try to register API ${s.key} at file ${s.options.sourceFile.absolute} but was already registered at file ${s2 && s2.options.sourceFile.absolute}`);
        this.api.$schemas.push(s);
        this.api.$schemaMapping[s.key] = s;
        return s;
      };
    }

    this.api.enable = (...list) => {
      for (const name of list) {
        assert(name in this.api.$features, `cannot enable unknown feature "${name}"`);
        this.api.$features[name] = true;
      }
      return this.api;
    };

    this.api.disable = (...list) => {
      for (const name of list) {
        assert(name in this.api.$features, `cannot disable unknown feature "${name}"`);
        this.api.$features[name] = false;
      }
      return this.api;
    };

    this.api.setOption = (name, value) => {
      this.api.$options[name] = value;
      return this.api;
    };

    this.api.getOption = (name) => {
      return this.api.$options[name];
    };

    this.api.use = (...list) => {
      for (const fn of list) {
        this.api.$express.middlewares.push(this._getApiMiddleware(fn));
      }
    };

    this.api.getType = (name) => {
      return this.api.$types[name];
    };

    this.api.registerType = (name, {checker, formatter, description = '', isDefault} = {}) => {
      formatter = formatter || ((v) => v);
      isDefault = !!isDefault;
      assert(name && typeof name === 'string', 'type name must be string');
      assert(/^[A-Z]/.test(name[0]), `type ${name} must be start with upper case`);
      assert(checker && typeof checker === 'function', 'type checker must be function');
      assert(formatter && typeof formatter === 'function', 'type formatter must be function');
      assert(typeof description === 'string', 'type description must be string');
      assert(!(name in this.api.$types), `type ${name} is already exists`);
      this.api.$types[name] = {checker, formatter, description, isDefault};
      if (!isDefault) {
        debug('register type: name=%s, checker=%s, formatter=%s, description=%s', name, checker, formatter, description);
      }
      return this.api;
    };

    registerDefaultTypes(this.api.registerType);

    this.api.registerError = (name, data = {}) => {
      assert(typeof name === 'string', 'error name must be string');
      assert(data && typeof data === 'object', 'second argument must be object');
      assert(data.status, 'missing option `status`');
      const info = {};
      if (data.message) {
        assert(typeof data.message === 'string' || typeof data.message === 'function', 'option `message` must be function or string');
        info.message = data.message;
        if (typeof info.message !== 'function') {
          const msg = info.message;
          info.message = () => msg;
        }
      } else {
        info.message = (msg) => msg;
      }
      info.data = this.utils.merge(data, {type: name});
      delete info.data.message;
      info.Error = this.utils.customError(name, info.data);
      debug('registerError: %s %j', name, data);
      this.api.$errors[name] = info;

      return this.api;
    };

    this.api.error = (name, msg, data) => {
      assert(this.api.$errors[name], `unknown error type ${name}`);
      const info = this.api.$errors[name];
      msg = info.message(msg, data || {});
      const err = new info.Error(msg, data);
      return err;
    };

    registerDefaultErrors(this.api.registerError);

    this.api.output = (fn) => {
      assert(typeof fn === 'function', 'output handler must be function');
      assert(fn.length >= 4, 'output handler must have 4 or 5 arguments');
      this.api.setOption('handleOutput', fn);
      return this.api;
    };
    this.api.output((err, ret, req, res, next) => {
      if (err) {
        const ret = {error: {}};
        if (err instanceof Error) {
          ret.status = ret.status || err.status || -1;
          ret.message = err.message;
          for (const n in err) {
            if (n === 'status' || n === 'message') continue;
            ret.error[n] = err[n];
          }
        } else {
          ret.status = -1;
          ret.message = ret.toString();
        }
        res.json(ret);
      } else {
        res.json({status: 0, result: ret});
      }
    });

    this.api.outputDocs = (path) => {
      this.api.setOption('docsPath', path);
    };

    const app = this.api.$express.app = express();
    const apiRouter = this.api.$express.apiRouter = createRouter();
    const sysRouter = this.api.$express.sysRouter = createRouter();

    const initTasks = this.api.$initTasks = [];

    // 系统基本服务相关的HTTP接口
    initTasks.push(() => {

      const DOCS_PATH = resolvePath(__dirname, '../docs');
      const SRC_DOCS_PATH = resolvePath(__dirname, '../../src/docs');

      const DOCS_DATA = {
        types: {},
        schemas: this.api.$schemas.map(v => v.options),
      };
      Object.keys(this.api.$types).map(n => {
        const s = this.api.$types[n];
        const v = {};
        for (const i in s) {
          v[i] = s[i];
        }
        v.checker = v.checker.toString();
        v.formatter = v.formatter.toString();
        DOCS_DATA.types[n] = v;
      });

      sysRouter.get('/data.json', (req, res, next) => {
        res.json(DOCS_DATA);
      });
      sysRouter.get('/data.js', (req, res, next) => {
        res.header('content-type', 'application/javascript');
        res.end(`DOCS_DATA = ${JSON.stringify(DOCS_DATA)}`);
      });

      sysRouter.get('/', (req, res, next) => {
        res.sendFile(resolvePath(SRC_DOCS_PATH, 'index.html'));
      });

      sysRouter.use('/assets', express.static(DOCS_PATH));
      sysRouter.use('/assets', express.static(SRC_DOCS_PATH));

    });

    // 用户注册的API相关的HTTP接口
    initTasks.push(() => {
      debug('extends apiRouter init...');

      const handleOutput = this.api.getOption('handleOutput');
      assert(typeof handleOutput === 'function', `api output handler must be function`);

      apiRouter.use((req, res, next) => {
        req.apiParams = {};
        res.apiOutput = (err, ret) => {
          debug('apiOutput: err=%j, ret=%j', (err && err.stack || err), ret);
          handleOutput(err, ret, req, res, next);
        };
        debug('new api request: [%s] %s', req.method, req.url);
        next();
      });

      debug('init api features...');
      if (this.api.$features.json) {
        debug('enable feature: json');
        apiRouter.use(bodyParser.json());
      }
      if (this.api.$features.urlencoded) {
        debug('enable feature: urlencoded');
        apiRouter.use(bodyParser.urlencoded());
      }
      if (this.api.$features.multipart) {
        debug('enable feature: multipart');
        apiRouter.use(multiparty());
      }

      debug('init api global middlewares: %s', this.api.$express.middlewares.length);
      for (const item of this.api.$express.middlewares) {
        apiRouter.use(item);
      }

      const wrapApiCall = (name) => {
        return (req, res, next) => {
          req.apiParams = mergeParams(req.query, req.body, req.files, req.params, req.apiParams);
          debug('api call: %s params=%j', name, req.apiParams);
          let p = null;
          try {
            p = this.method(name).call(req.apiParams);
          } catch (err) {
            return res.apiOutput(err);
          }
          p.then(ret => res.apiOutput(null, ret));
          p.catch(err => res.apiOutput(err));
        };
      };

      // 开始注册API
      debug('register schemas: %s', this.api.$schemas.length);
      for (const schema of this.api.$schemas) {
        const {name, before, handler} = schema.init(this.api);
        for (const fn of before) {
          this.method(name).before(fn);
        }
        this.method(name).register(handler);
        if (schema.options.middlewares.length > 0) {
          const middlewares = schema.options.middlewares.map(fn => this._getApiMiddleware(fn));
          apiRouter[schema.options.method](schema.options.path, ...middlewares);
          debug('register api middlewares: %s before=%s [%s] %s', name, middlewares.length, schema.options.method, schema.options.path);
        }
        apiRouter[schema.options.method](schema.options.path, wrapApiCall(name));
        debug('register api route: %s before=%s [%s] %s', name, before.length, schema.options.method, schema.options.path);
      }

      // 捕捉出错信息
      apiRouter.use((err, req, res, next) => {
        debug('api error: %j', err && err.stack || err);
        handleOutput(err, null, req, res, next);
      });

      if (this.api.getOption('port')) {
        const port = this.api.getOption('port');
        debug('listen port %s', port)
        app.listen(port);
      }
    });

    // 注册路由
    initTasks.push(() => {
      debug('extends sysRouter init...')
      app.use('/-docs', sysRouter);
      app.use(apiRouter);
    });

  }

  _getApiMiddleware(fn) {
    const type = typeof fn;
    if (type === 'string') {
      throw new Error(`unknown middleware ${fn}`);
    } else if (type === 'function') {
      return fn;
    } else {
      throw new Error('middleware must be string or function');
    }
  }

  init(callback) {
    debug('init');

    super.init(err => {
      if (err) return callback && callback(err);

      this.utils.runSeries(this.api.$initTasks, this, (err) => {
        debug('ready: err=%s', err);
        if (err) {
          this.event.emit('error', err);
          return callback && callback(err);
        }

        callback && callback(err);
      });
    });

  }

}
