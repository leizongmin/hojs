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
        res.json({status: err.code || 2, error: err.data});
      } else {
        res.json({status: 1, result: ret});
      }
    });

    const app = this.api.$express.app = express();
    const router = this.api.$express.router = express.Router();

    this.extends({
      after: () => {

        for (const item of this.api.$express.middlewares) {
          router.use(item);
        }

        app.use((req, res, next) => {
          res.apiOutput = function (err, ret) {
            this.api.getOption('handleOutput')(err, ret, req, res, next);
          };
        });
        app.use(router);

        for (const item of this.api.$schemas) {
          
        }

        if (this.api.getOption('port')) {
          app.listen(this.api.getOption('port'));
        }
      },
    });

  }

}
