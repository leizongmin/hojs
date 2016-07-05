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

import extendsRegister from './extend/register';
import extendsEnableAndOption from './extend/enable_and_option';
import extendsMiddleware from './extend/middleware';
import extendsType from './extend/type';
import extendsError from './extend/error';
import extendsOutput from './extend/output';
import extendsTest from './extend/test';
import extendsDocs from './extend/docs';

import initApi from './init/api';

/**
 * ProjectCore类
 */
export default class Hojs extends ProjectCore {

  /**
   * 构造函数
   *
   * @param {Object} options
   *   - {String} path API项目路径
   */
  constructor(options) {
    super();
    this.validator = validator;
    this.config.set('api.path', options.path || process.cwd());
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
    this.api.$types = {};
    this.api.$errors = {};
    this.api.$express = {};
    this.api.$express.app = null;
    this.api.$express.apiRouter = null;
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
    extendsTest.call(this);
    extendsDocs.call(this);

    const app = this.api.$express.app = express();
    const apiRouter = this.api.$express.apiRouter = createRouter();

    const initTasks = this.api.$initTasks = [];
    initTasks.push(initApi.call(this));
    initTasks.push(() => {
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
        if (err) {
          this.event.emit('error', err);
          return callback && callback(err);
        }

        callback && callback(err);
      });
    });

  }

}
