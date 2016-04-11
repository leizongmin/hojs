'use strict';

/**
 * hojs
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

import assert from 'assert';
import express from 'express';
import validator from 'validator';
import ProjectCore from 'project-core';

import {core as debug} from './debug';
import {
  createRouter,
  mergeParams,
  wrapAsyncMiddleware,
} from './utils';

import extendsRegister from './extends/register';
import extendsEnableAndOption from './extends/enable_and_option';
import extendsMiddleware from './extends/middleware';
import extendsType from './extends/type';
import extendsError from './extends/error';
import extendsOutput from './extends/output';

import initDocs from './init/docs';
import initApi from './init/api';


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
    this.api.$hookOutputs = [];
    this.api.$middlewaresMapping = {};
    this.api.$options = {};
    this.api.$features = {
      multipart: true,
      urlencoded: true,
      json: true,
      outputSession: false,
      outputCookies: true,
      outputHeaders: true,
      inputSession: false,
      inputCookies: false,
      inputHeaders: false,
    };

    extendsRegister.call(this);
    extendsEnableAndOption.call(this);
    extendsMiddleware.call(this);
    extendsType.call(this);
    extendsError.call(this);
    extendsOutput.call(this);

    const app = this.api.$express.app = express();
    const apiRouter = this.api.$express.apiRouter = createRouter();
    const sysRouter = this.api.$express.sysRouter = createRouter();

    const initTasks = this.api.$initTasks = [];
    initTasks.push(initDocs.call(this));
    initTasks.push(initApi.call(this));
    initTasks.push(() => {
      debug('extends sysRouter init...')
      app.use('/-docs', sysRouter);
      app.use(apiRouter);
    });

  }

  _getApiMiddleware(fn) {
    const type = typeof fn;
    if (type === 'string') {
      const handler = this.api.$middlewaresMapping[fn];
      assert(typeof handler === 'function', `unknown middleware ${fn}`);
      return handler;
    } else if (type === 'function') {
      return wrapAsyncMiddleware(fn);
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
