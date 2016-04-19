'use strict';

/**
 * hojs
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

import fs from 'fs';
import util from 'util';
import assert from 'assert';
import request from 'supertest';
import utils from 'lei-utils';
import {test as debug, create as createDebug} from './debug';

const SUPPORT_METHOD = ['get', 'post', 'put', 'delete'];

const AssertionError = utils.customError('AssertionError', {type: 'api_output_error'});

function inspect(obj) {
  return util.inspect(obj, {
    depth: 5,
    colors: true,
  });
}

export default class TestAgent {

  constructor(method, path, sourceFile, parent) {
    assert(method && typeof method === 'string', '`method` must be string');
    assert(TestAgent.SUPPORT_METHOD.indexOf(method.toLowerCase()) !== -1, '`method` must be one of ' + TestAgent.SUPPORT_METHOD);
    assert(path && typeof path === 'string', '`path` must be string');
    assert(path[0] === '/', '`path` must be start with "/"');
    this.options = {
      parent,
      sourceFile,
      method: method.toLowerCase(),
      path,
      agent: null,
    };
    this.key = `${method.toUpperCase()} ${path}`;
    this._extendsOutput();
    this.debug = createDebug(`agent:${this.key}`);
    this.debug('new: %s %s from %s', method, path, sourceFile.absolute);
  }

  agent(app, rawSupertest = false) {
    assert(app, `express app instance could not be empty`);
    if (!this.options.agent) {
      this.debug('create supertest agent');
      this.options.agent = request(app)[this.options.method](this.options.path);
    }
    debug('agent: rawSupertest=%s', rawSupertest);
    if (rawSupertest) {
      return this.options.agent;
    } else {
      return this;
    }
  }

  input(data) {
    this.debug('input: %j', data);
    if (this.options.method === 'get' || this.options.method === 'head') {
      this.options.agent.query(data);
    } else {
      for (i in data) {
        if (data[i] instanceof fs.ReadStream) {
          this.options.agent.attach(i, data[i]);
        } else {
          this.options.agent.field(i, data[i]);
        }
      }
    }
    return this;
  }

  _extendsOutput() {

    this.output = (callback) => {
      this.options.agent.end((err, res) => {
        if (err) return callback(err);
        const formatOutputReverse = this.options.parent.api.getOption('formatOutputReverse');
        const rets = formatOutputReverse(res.body);
        callback(...rets);
      });
    };

    this.output.success = (done) => {
      this.output((err, ret) => {
        if (err) {
          done(new AssertionError(`output excepted success but got an error ${inspect(err)}`));
        } else {
          done();
        }
      });
    };

    this.output.error = (done) => {
      this.output((err, ret) => {
        if (err) {
          done();
        } else {
          done(new AssertionError(`output excepted an error but got result ${inspect(ret)}`));
        }
      });
    };

  }

}

TestAgent.SUPPORT_METHOD = SUPPORT_METHOD;
