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
} from './utils';

import extendRegister from './extend/register';
import extendEnableAndOption from './extend/enable_and_option';
import extendMiddleware from './extend/middleware';
import extendType from './extend/type';
import extendError from './extend/error';
import extendOutput from './extend/output';
import extendTest from './extend/test';
import extendDocs from './extend/docs';

import ExpressEngine from './engine/express';

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
    this.inited = false;
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
    this.api.$hookOutputs = [];
    this.api.$middlewares = [];
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
    this.api.$flag = {
      saveApiInputOutput: false,
    };

    // ServerEngine
    this.server = new ExpressEngine(this);

    extendRegister.call(this);
    extendEnableAndOption.call(this);
    extendMiddleware.call(this);
    extendType.call(this);
    extendError.call(this);
    extendOutput.call(this);
    extendTest.call(this);
    extendDocs.call(this);

    // 初始化schema
    this.api.$initTasks.push(() => {
      for (const schema of this.api.$schemas) {
        const {name, before, handler} = schema.init(this.api);
        for (const fn of before) {
          this.method(name).before(fn);
        }
        this.method(name).register(handler);
      }
    });

    // 初始化Web引擎
    this.api.$initTasks.push((done) => {
      this.server.init(done);
    });

    // 监听端口
    this.api.$initTasks.push((done) => {
      const port = this.api.getOption('port');
      if (port) {
        this.server.listen(null, port, done);
      } else {
        done();
      }
    });

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
   * 检查是否已初始化，如果已初始化则抛出异常
   *
   * @param {String} msg 描述
   */
  _checkInited(msg) {
    assert(this.inited === false, `系统已经初始化，不能再执行此操作${msg ? '：' + msg : ''}`);
  }

}
