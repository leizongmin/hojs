'use strict';

/**
 * hojs
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

import assert from 'assert';
import {resolve as resolvePath} from 'path';
import express from 'express';
import {core as debug} from '../debug';

export default function () {

  const app = this.api.$express.app;
  const apiRouter = this.api.$express.apiRouter;
  const sysRouter = this.api.$express.sysRouter;

  return () => {
    const DOCS_PATH = resolvePath(__dirname, '../../docs');
    const SRC_DOCS_PATH = resolvePath(__dirname, '../../../src/docs');

    const DOCS_DATA = {
      types: {},
      errors: {},
      schemas: this.api.$schemas.map(v => v.options),
    };
    Object.keys(this.api.$types).map(n => {
      const t = this.utils.merge(this.api.$types[n]);
      t.checker = t.checker.toString();
      t.formatter = t.formatter.toString();
      DOCS_DATA.types[n] = t;
    });
    Object.keys(this.api.$errors).map(n => {
      const e = this.utils.merge(this.api.$errors[n]);
      e.message = e.message.toString();
      DOCS_DATA.errors[n] = e;
    });

    const formatOutput = this.api.getOption('formatOutput');
    for (const s of DOCS_DATA.schemas) {
      if (s.examples) {
        s.examples.forEach(v => {
          v.output = formatOutput(null, v.output);
        });
      }
    }

    sysRouter.get('/data.json', (req, res, next) => {
      res.json(DOCS_DATA);
    });
    sysRouter.get('/data.js', (req, res, next) => {
      res.header('content-type', 'application/javascript');
      res.end(`DOCS_DATA = ${JSON.stringify(DOCS_DATA)}`);
    });

    sysRouter.get('/', (req, res, next) => {
      res.sendFile(resolvePath(SRC_DOCS_PATH, 'index.html'));
    });

    sysRouter.use('/assets', express.static(DOCS_PATH));
    sysRouter.use('/assets', express.static(SRC_DOCS_PATH));
  };

};
