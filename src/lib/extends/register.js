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

  for (const method of Schema.SUPPORT_METHOD) {
    this.api[method] = (path) => {
      const s = new Schema(method, path, getCallerSourceLine(this.config.get('api.path')));
      const s2 = this.api.$schemaMapping[s.key];
      assert(!s2, `try to register API ${s.key} at file ${s.options.sourceFile.absolute} but was already registered at file ${s2 && s2.options.sourceFile.absolute}`);
      this.api.$schemas.push(s);
      this.api.$schemaMapping[s.key] = s;
      return s;
    };
  }

};
