/**
 * ho web
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

import path from 'path';
import fs from 'fs';
import express from 'express';
import serveStatic from 'serve-static';
import {$HO, $HO$} from '../global';
let debug = $HO$.utils.debug('web');


$HO('web.express', express());
(app => {

  app.use('/assets', serveStatic(path.resolve($HO$.WEB_DIR, 'assets'), $HO$.config.get('web.assets')));

  let route = (method, path, fn) => {
    method = method.toLowerCase();
    debug(`route: [${method}] ${path}`);
    app[method](path, (req, res, next) => {
      debug(`accept request: [${method} ${path}] ${req.method} ${req.url}`);
      fn(req, res, next);
    });
  };
  ['get', 'head', 'post', 'put', 'del'].forEach(method => {
    route[method] = (path, fn) => route(method, path, fn);
  });

  route.get('/', async (req, res, next) => {
    res.send(new Date());
  });

  let port = $HO$.config.get('web.port');
  app.listen(port, err => {
    if (err) throw err;
    $HO$.log(`web server listen on port ${port}`);
  });

})($HO$.web.express);
