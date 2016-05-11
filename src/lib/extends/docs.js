'use strict';

/**
 * hojs
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

import fs from 'fs';
import assert from 'assert';
import {resolve as resolvePath} from 'path';
import express from 'express';
import {core as debug} from '../debug';

export default function () {

  this.api.makeDocs = () => {

    const docsData = {
      types: {},
      errors: {},
      schemas: this.api.$schemas.map(v => v.options),
    };
    Object.keys(this.api.$types).map(n => {
      const t = this.utils.merge(this.api.$types[n]);
      t.checker = t.checker.toString();
      t.formatter = t.formatter.toString();
      docsData.types[n] = t;
    });
    Object.keys(this.api.$errors).map(n => {
      const e = this.utils.merge(this.api.$errors[n]);
      e.message = e.message.toString();
      docsData.errors[n] = e;
    });

    const formatOutput = this.api.getOption('formatOutput');
    for (const s of docsData.schemas) {
      if (s.examples) {
        s.examples.forEach(v => {
          v.output = formatOutput(null, v.output);
        });
      }
    }

    return {

      data() {
        return docsData;
      },

      save(file) {
        fs.writeFileSync(file, JSON.stringify(docsData));
      }

    };

  };

};
