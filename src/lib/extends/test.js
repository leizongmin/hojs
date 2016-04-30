'use strict';

/**
 * hojs
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

import assert from 'assert';
import supertest from 'supertest';
import {getCallerSourceLine} from '../utils';
import {test as debug} from '../debug';
import TestAgent from '../test_agent';

export default function () {

  this.test = {};

  // test.get, this.post, ...
  for (const method of TestAgent.SUPPORT_METHOD) {
    this.test[method] = (path, rawSupertest) => {

      const a = new TestAgent(method, path, getCallerSourceLine(this.config.get('api.path')), this);
      const s = this.api.$schemaMapping[a.key];
      assert(s, `try to request undefined API ${a.key} at file ${s.options.sourceFile.absolute}`);

      a.initAgent(this.api.$express.app);
      return a.agent(rawSupertest);

    };
  }

  this.test.session = () => {

    const session = {};
    session.$$agent = supertest.agent(this.api.$express.app);

    for (const method of TestAgent.SUPPORT_METHOD) {
      session[method] = (path, rawSupertest) => {

        const a = new TestAgent(method, path, getCallerSourceLine(this.config.get('api.path')), this);
        const s = this.api.$schemaMapping[a.key];
        assert(s, `try to request undefined API ${a.key} at file ${s.options.sourceFile.absolute}`);

        a.setAgent(session.$$agent[method](path));
        return a.agent(rawSupertest);

      };
    }

    return session;

  };

  this.test.suite = (name, init) => {

    assert(name, 'test suite name could not empty');
    assert(typeof name === 'string', `test suite name must be string but got ${name}(${typeof name})`);
    assert(typeof init === 'function', `test suite init scripts must be function but got ${name}(${typeof name})`);

    assert(typeof describe === 'function', `describe() is not a function, please be sure running this file in mocha`);
    assert(typeof before === 'function', `before() is not a function, please be sure running this file in mocha`);
    assert(typeof after === 'function', `after() is not a function, please be sure running this file in mocha`);

    describe(name, () => {

      before(done => {
        debug('test suite before: %s', name);
        this.ready(err => {
          if (err) {
            debug('test suite not ready: %s', err);
          } else {
            debug('test suite ready: %s', name);
          }
          done(err);
        });
      });

      after(done => {
        debug('test suite after: %s', name);
        done();
      });

      debug('test suite init: %s', name);
      init();

    });

  };

};
