'use strict';

/**
 * hojs
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

import fs from 'fs';
import path from 'path';
import assert from 'assert';
import {resolve as resolvePath} from 'path';
import express from 'express';
import mkdirp from 'mkdirp';
import generateMarkdown from '../plugin/generate_markdown';
import {docs as debug} from '../debug';

export default function () {

  this.api.docs = {};
  const plugins = [];

  this.api.docs.data = () => {
    const data = {
      types: {},
      errors: {},
      schemas: this.api.$schemas.map(v => v.options),
    };
    Object.keys(this.api.$types).map(n => {
      const t = this.utils.merge(this.api.$types[n]);
      t.name = n;
      t.checker = t.checker.toString();
      t.formatter = t.formatter.toString();
      data.types[n] = t;
    });
    Object.keys(this.api.$errors).map(n => {
      const e = this.utils.merge(this.api.$errors[n]);
      e.name = n;
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

  this.api.docs.takeSample = () => {
    this.api.$saveApiInputOutput = true;
    return this.api.docs;
  };

  this.api.docs.markdown = () => {
    plugins.push(generateMarkdown);
    return this.api.docs;
  };

  this.api.docs.save = (dir) => {

    assert(typeof dir === 'string' && dir.length > 0, `save(${dir}) failed: dir must be string`);
    mkdirp.sync(dir);

    const data = this.api.docs.data();
    fs.writeFileSync(path.resolve(dir, 'all.json'), this.utils.jsonStringify(data, 2));

    for (const fn of plugins) {
      fn(data, dir);
    }

    return this.api.docs;
  };

  this.api.docs.saveOnExit = (dir) => {
    process.on('exit', () => {
      this.api.docs.save(dir);
    });
    return this.api.docs;
  };

};
