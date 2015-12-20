/**
 * ho web
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

import path from 'path';
import express from 'express';
import serveStatic from 'serve-static';
import ejs from 'ejs';

export default function (project) {

  let app = express();

  app.set('views', path.resolve(__dirname, 'views'));
  app.set('view engine', 'html');
  app.engine('html', ejs.__express);
  app.use('/assets', serveStatic(path.resolve(__dirname, 'assets')));

  app.use('/', project.router('default'));

  return app;

};
