'use strict';

/**
 * hojs
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

import assert from 'assert';
import Schema from '../schema';
import {getCallerSourceLine} from '../utils';
import {core as debug} from '../debug';

export default function () {

  this.api.override = {};

  const register = (method, path, strict = true) => {

    const s = new Schema(method, path, getCallerSourceLine(this.config.get('api.path')));
    const s2 = this.api.$schemaMapping[s.key];

    if (strict) {
      assert(!s2, `try to register API ${s.key} at file ${s.options.sourceFile.absolute} but was already registered at file ${s2 && s2.options.sourceFile.absolute}`);
    }

    if (s2) {
      removeSchemas(s.key);
      debug('override API: %s %s at %s', method, path, s.options.sourceFile.absolute);
    }

    this.api.$schemas.push(s);
    this.api.$schemaMapping[s.key] = s;
    return s;

  };

  const removeSchemas = (key) => {

    for (let i = 0; i < this.api.$schemas.length; i++) {
      const s = this.api.$schemas[i];
      if (s.key === key) {
        this.api.$schemas.splice(i, 1);
        i--;
      }
    }

  };

  for (const method of Schema.SUPPORT_METHOD) {
    this.api[method] = (path) => {
      return register(method, path, true);
    };
    this.api.override[method] = (path) => {
      return register(method, path, false);
    };
  }

};
