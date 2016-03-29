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
import validator from 'validator';
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
    this.api.$types = {};
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
    this._registerDefaultTypes();

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
          ret.status = ret.status || err.code || -1;
          ret.message = err.message;
          for (const n in err) {
            if (n === 'code' || n === 'message') continue;
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
          const {name, before, handler} = schema.init(this.api);
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

  _registerDefaultTypes() {

    this.api.registerType('Boolean', {
      checker: (v) => typeof v === 'boolean' || (typeof v === 'string' && validator.isBoolean(v)),
      formatter: (v) => String(v).toLowerCase() === 'true' ? true : false,
      description: 'boolean',
      isDefault: true,
    });
    this.api.registerType('Date', {
      checker: (v) => v instanceof Date || (typeof v === 'string' && validator.isDate(v)),
      formatter: (v) => new Date(v),
      description: 'Date',
      isDefault: true,
    });
    this.api.registerType('String', {
      checker: (v) => typeof v === 'string',
      description: 'String',
      isDefault: true,
    });
    this.api.registerType('Number', {
      checker: (v) => !isNaN(v),
      formatter: (v) => Number(v),
      description: 'Number',
      isDefault: true,
    });
    this.api.registerType('Integer', {
      checker: (v) => validator.isInt(String(v)),
      formatter: (v) => Number(v),
      description: 'Integer',
      isDefault: true,
    });
    this.api.registerType('Float', {
      checker: (v) => validator.isFloat(String(v)),
      formatter: (v) => Number(v),
      description: 'Float',
      isDefault: true,
    });
    this.api.registerType('Object', {
      checker: (v) => v && typeof v === 'object',
      description: 'Object',
      isDefault: true,
    });
    this.api.registerType('Array', {
      checker: (v) => Array.isArray(v),
      description: 'Array',
      isDefault: true,
    });
    this.api.registerType('JSON', {
      checker: (v) => typeof v === 'string' && validator.isJSON(v),
      formatter: (v) => v.trim(),
      description: 'string is valid JSON',
      isDefault: true,
    });
    this.api.registerType('MongoId', {
      checker: (v) => validator.isMongoId(String(v)),
      description: 'string is a valid hex-encoded representation of a MongoDB ObjectId',
      isDefault: true,
    });
    this.api.registerType('Email', {
      checker: (v) => typeof v === 'string' && validator.isEmail(v),
      formatter: (v) => v.trim(),
      description: 'string is an email',
      isDefault: true,
    });
    this.api.registerType('Domain', {
      checker: (v) => typeof v === 'string' && validator.isFQDN(v),
      formatter: (v) => v.trim(),
      description: 'string is a fully qualified domain name (e.g. domain.com)',
      isDefault: true,
    });
    this.api.registerType('Alpha', {
      checker: (v) => typeof v === 'string' && validator.isAlpha(v),
      description: 'string contains only letters (a-zA-Z).',
      isDefault: true,
    });
    this.api.registerType('AlphaNumeric', {
      checker: (v) => typeof v === 'string' && validator.isAlphanumeric(v),
      description: 'string contains only letters and numbers',
      isDefault: true,
    });
    this.api.registerType('Ascii', {
      checker: (v) => typeof v === 'string' && validator.isAscii(v),
      description: 'string contains ASCII chars only',
      isDefault: true,
    });
    this.api.registerType('Base64', {
      checker: (v) => typeof v === 'string' && validator.isBase64(v),
      formatter: (v) => v.trim(),
      description: 'string is base64 encoded',
      isDefault: true,
    });
    this.api.registerType('URL', {
      checker: (v) => typeof v === 'string' && validator.isURL(v),
      formatter: (v) => v.trim(),
      description: 'string is an URL',
      isDefault: true,
    });

  }

}