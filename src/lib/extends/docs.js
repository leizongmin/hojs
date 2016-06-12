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

  this.api.docs = {};

  this.api.docs.data = () => {
    const data = {
      types: {},
      errors: {},
      schemas: this.api.$schemas.map(v => v.options),
    };
    Object.keys(this.api.$types).map(n => {
      const t = this.utils.merge(this.api.$types[n]);
      t.checker = t.checker.toString();
      t.formatter = t.formatter.toString();
      data.types[n] = t;
    });
    Object.keys(this.api.$errors).map(n => {
      const e = this.utils.merge(this.api.$errors[n]);
      e.message = e.message.toString();
      data.errors[n] = e;
    });
    const formatOutput = this.api.getOption('formatOutput');
    for (const s of data.schemas) {
      if (s.examples) {
        s.examples.forEach(v => {
          v.output = formatOutput(null, v.output);
        });
      }
    }
    return data;
  };

  this.api.docs.save = (file) => {
    assert(typeof file === 'string' && file.length > 0, `save(${file}) failed: filename must be string`);
    fs.writeFileSync(file, this.utils.jsonStringify(this.api.docs.data(), 2));
  };

  this.api.docs.saveOnExit = (file) => {
    process.on('exit', () => {
      this.api.docs.save(file);
    });
  };

};
