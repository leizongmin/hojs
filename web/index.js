/**
 * ho web
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

import path from 'path';
import fs from 'fs';
import express from 'express';
import serveStatic from 'serve-static';
import {eachFileFilterSync} from 'rd';
import {$HO, $HO$} from '../global';
let debug = $HO$.utils.debug('web');


let app = express();
let router = express.Router();
let ROUTER_REGISTERED = Symbol('router_registered');
router[ROUTER_REGISTERED] = {};


let routeHandler = {};
let route = (method, path, fn) => {

  method = method.toLowerCase();
  debug(`route: [${method}] ${path}`);

  let name = `${method}:${path}`;
  if (!router[ROUTER_REGISTERED][name]) {
    router[method](path, (req, res, next) => {
      debug(`accept request: [${method} ${path}] ${req.method} ${req.url}`);
      let fn = routeHandler[name];
      if (typeof fn === 'function') {
        fn(req, res, next);
      } else {
        delete routeHandler[name];
        debug(`no handler: ${name}`);
        next();
      }
    });
    router[ROUTER_REGISTERED][name] = true;
  }
  routeHandler[name] = fn;

};
['get', 'head', 'post', 'put', 'del'].forEach(method => {
  route[method] = (path, fn) => route(method, path, fn);
});


app.use(router);
router.use('/assets', serveStatic(path.resolve($HO$.WEB_DIR, 'assets'), $HO$.config.get('web.assets')));


function listen() {
  let port = $HO$.config.get('web.port');
  let server = app.listen(port, err => {
    if (err) throw err;

    $HO('web.server', server);
    $HO('web.express', app);
    $HO('web.router', router);
    $HO('web.route', route);
    $HO('web.routeHandler', routeHandler);

    // auto load routes
    eachFileFilterSync(path.resolve($HO$.WEB_DIR, 'routes'), /\.js$/, f => {
      debug(`load routes: ${f}`);
      require(f);
    });

    $HO$.log(`web server listen on port ${port}`);
    $HO$.event.emit('web server listening', port);
  });
}

if ($HO('web.server')) {
  $HO$.log(`stop web server...`);
  $HO$.web.server.close(err => {
    if (err) throw err;
  });
  listen();
} else {
  listen();
}
