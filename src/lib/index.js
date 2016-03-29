'use strict';

/**
 * hojs
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

import assert from 'assert';
import express from 'express';
import multiparty from 'connect-multiparty';
import bodyParser from 'body-parser';
import ProjectCore from 'project-core';
import Schema from './schema';
import {core as debug} from './debug';


export default class Hojs extends ProjectCore {

  constructor() {
    super();
    this._extendsApi();
  }

  _extendsApi() {

    this.api = {};
    this.api.$options = {};
    this.api.$schemas = [];
    this.api.$express = {};
    this.api.$express.app = null;
    this.api.$express.middlewares = [];

    for (const method of Schema.SUPPORT_METHOD) {
      this.api[method] = (path) => {
        const s = new Schema(method, path);
        this.api.$schemas.push(s);
        return s;
      };
    }

    this.api.enable = (...list) => {
      const enable = (name) => {
        switch (name) {
          case 'json':
            this.api.$express.middlewares.push(bodyParser.json());
            break;
          case 'urlencoded':
            this.api.$express.middlewares.push(bodyParser.urlencoded());
            break;
          case 'multipart':
            this.api.$express.middlewares.push(multiparty());
            break;
          default:
            throw new Error(`cannot enable unknown feature "${name}"`);
        }
      };
      list.forEach(enable);
      return this.api;
    };

    this.api.setOption = (name, value) => {
      this.api.$options[name] = value;
      return this.api;
    };

    this.api.getOption = (name) => {
      return this.api.$options[name];
    };

    this.api.output = (fn) => {
      assert(typeof fn === 'function', 'output handler must be function');
      assert(fn.length >= 4, 'output handler must have 4 or 5 arguments');
      this.api.setOption('handleOutput', fn);
      return this.api;
    };
    this.api.output((err, ret, req, res, next) => {
      if (err) {
        res.json({status: err.code || -1, error: err.toString()});
      } else {
        res.json({status: 0, result: ret});
      }
    });

    const app = this.api.$express.app = express();
    const router = this.api.$express.router = express.Router({
      caseSensitive: true,
      mergeParams: true,
      strict: true,
    });

    this.extends({
      after: () => {

        const handleOutput = this.api.getOption('handleOutput');
        assert(typeof handleOutput === 'function', `api output handler must be function`);

        const mergeParams = (...list) => {
          const ret = {};
          for (const item of list) {
            if (item && typeof item === 'object') {
              for (const i in item) {
                ret[i] = item[i];
              }
            }
          }
          return ret;
        };
        router.use((req, res, next) => {
          res.apiOutput = (err, ret) => {
            debug('apiOutput: err=%j, ret=%j', (err && err.stack || err), ret);
            handleOutput(err, ret, req, res, next);
          };
          debug('new api request: [%s] %s', req.method, req.url);
          next();
        });

        for (const item of this.api.$express.middlewares) {
          router.use(item);
        }

        router.use((err, req, res, next) => {
          debug('api error: %j', err && err.stack || err);
          handleOutput(err, null, req, res, next);
        });

        app.use(router);

        const wrapApiCall = (name) => {
          return (req, res, next) => {
            req.apiInput = mergeParams(req.query, req.body, req.params)
            debug('api call: %s params=%j', name, req.apiInput);
            let p = null;
            try {
              p = this.method(name).call(req.apiInput);
            } catch (err) {
              return res.apiOutput(err);
            }
            p.then(ret => res.apiOutput(null, ret));
            p.catch(err => res.apiOutput(err));
          };
        };

        for (const schema of this.api.$schemas) {
          const {name, before, handler} = schema.init();
          for (const fn of before) {
            this.method(name).before(fn);
          }
          this.method(name).register(handler);
          router[schema.options.method](schema.options.path, wrapApiCall(name));
          debug('register api route: %s before=%s [%s] %s', name, before.length, schema.options.method, schema.options.path);
        }

        if (this.api.getOption('port')) {
          const port = this.api.getOption('port');
          debug('listen port %s', port)
          app.listen(port);
        }
      },
    });

  }

}
