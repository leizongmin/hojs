'use strict';

/**
 * hojs
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

import assert from 'assert';
import request from 'supertest';
import {test as debug} from './debug';

const SUPPORT_METHOD = ['get', 'post', 'put', 'delete']

export default class TestAgent {

  constructor(method, path, sourceFile) {
    assert(method && typeof method === 'string', '`method` must be string');
    assert(TestAgent.SUPPORT_METHOD.indexOf(method.toLowerCase()) !== -1, '`method` must be one of ' + TestAgent.SUPPORT_METHOD);
    assert(path && typeof path === 'string', '`path` must be string');
    assert(path[0] === '/', '`path` must be start with "/"');
    this.options = {
      sourceFile,
      method: method.toLowerCase(),
      path,
      agent: null,
    };
    this.key = `${method.toUpperCase()} ${path}`;
    debug('new: %s %s from %s', method, path, sourceFile);
  }

  agent(app) {
    assert(app, `express app instance could not be empty`);
    if (!this.options.agent) {
      debug('create supertest agent');
      this.options.agent = request(app)[this.options.method](this.options.path);
    }
    return this.options.agent;
  }

}

TestAgent.SUPPORT_METHOD = SUPPORT_METHOD;
