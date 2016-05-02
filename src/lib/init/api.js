'use strict';

/**
 * hojs
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

import assert from 'assert';
import bodyParser from 'body-parser';
import multiparty from 'connect-multiparty';
import {mergeParams} from '../utils';
import {core as debug} from '../debug';

export default function () {

  const app = this.api.$express.app;
  const apiRouter = this.api.$express.apiRouter;
  const sysRouter = this.api.$express.sysRouter;

  return () => {
    debug('extends apiRouter init...');

    const formatOutput = this.api.getOption('formatOutput');
    const processOutput = (err, ret, req, res, next) => {
      let data = null;
      try {
        data = formatOutput(err, ret);
      } catch (err) {
        return next(err);
      }
      res.json(data);
    };

    apiRouter.use((req, res, next) => {
      req.apiParams = {};
      res.apiOutput = (err, ret) => {
        debug('apiOutput: err=%j, ret=%j', (err && err.stack || err), ret);
        processOutput(err, ret, req, res, next);
      };
      debug('new api request: [%s] %s', req.method, req.url);
      next();
    });

    if (this.api.isEnable('json')) {
      debug('enable feature: json');
      apiRouter.use(bodyParser.json());
    }
    if (this.api.isEnable('urlencoded')) {
      debug('enable feature: urlencoded');
      apiRouter.use(bodyParser.urlencoded({extended: false}));
    }
    if (this.api.isEnable('multipart')) {
      debug('enable feature: multipart');
      apiRouter.use(multiparty());
    }

    debug('init api global middlewares: %s', this.api.$express.middlewares.length);
    for (const item of this.api.$express.middlewares) {
      apiRouter.use(item);
    }

    const mergeApiParams = (req, res, next) => {
      req.apiParams = mergeParams(
        req.query,
        req.body,
        req.files,
        req.params,
        this.api.isEnable('inputCookies') ? {$cookies: req.cookies || {}} : null,
        this.api.isEnable('inputHeaders') ? {$headers: req.headers || {}} : null,
        this.api.isEnable('inputSession') ? {$session: req.session || {}} : null,
        req.apiParams
      );
      next();
    };

    const hookOutput = (err, ret, req, res, next) => {
      if (ret) {
        try {
          for (const fn of this.api.$hookOutputs) {
            ret = fn(ret, req, res);
          }
        } catch (err) {
          return res.apiOutput(err, ret);
        }
      }
      res.apiOutput(err, ret);
    };
    if (this.api.isEnable('outputHeaders')) {
      this.api.hookOutput((ret, req, res) => {
        if (ret.$headers) {
          // example: $headers: {'content-type': 'text/html'}
          for (const i in ret.$headers) {
            res.setHeader(i, ret.$headers[i]);
          }
          delete ret.$headers;
        }
        return ret;
      });
    }
    if (this.api.isEnable('outputCookies')) {
      this.api.hookOutput((ret, req, res) => {
        if (ret.$cookies) {
          // example: $cookies: {name: [value, options]}
          for (const i in ret.$cookies) {
            assert(Array.isArray(ret.$cookies[i]), `$cookies.${i} must be array: [value, options]`);
            res.cookie(i, ...ret.$cookies[i]);
          }
          delete ret.$cookies;
        }
        if (ret.$removeCookies) {
          // example: $removeCookies: ['name1', 'name2']
          for (const n of ret.$removeCookies) {
            res.clearCookie(n);
          }
          delete ret.$removeCookies;
        }
        return ret;
      });
    }
    if (this.api.isEnable('outputSession')) {
      this.api.hookOutput((ret, req, res) => {
        if (ret.$session) {
          // example: $session: {name: value}
          for (const i in ret.$session) {
            req.session[i] = ret.$session[i];
          }
          delete ret.$session;
        }
        if (ret.$removeSession) {
          // example: $removeSession: ['name1', 'name2']
          for (const n of ret.$removeSession) {
            delete req.session[n];
          }
          delete ret.$removeSession;
        }
        return ret;
      })
    }

    const wrapApiCall = (name) => {
      return (req, res, next) => {
        debug('api call: %s params=%j', name, req.apiParams);
        let p = null;
        try {
          p = this.method(name).call(req.apiParams);
        } catch (err) {
          return hookOutput(err, undefined, req, res, next);
        }
        p.then(ret => hookOutput(null, ret, req, res, next));
        p.catch(err => hookOutput(err, undefined, req, res, next));
      };
    };

    // 开始注册API
    debug('register schemas: %s', this.api.$schemas.length);
    for (const schema of this.api.$schemas) {

      const {name, before, handler} = schema.init(this.api);
      for (const fn of before) {
        this.method(name).before(fn);
      }
      this.method(name).register(handler);

      const register = apiRouter[schema.options.method].bind(apiRouter);
      register(schema.options.path, mergeApiParams);

      if (schema.options.middlewares.length > 0) {
        const middlewares = schema.options.middlewares.map(fn => this._getApiMiddleware(fn));
        register(schema.options.path, ...middlewares);
        debug('register api middlewares: %s before=%s [%s] %s', name, middlewares.length, schema.options.method, schema.options.path);
      }

      register(schema.options.path, wrapApiCall(name));
      debug('register api route: %s before=%s [%s] %s', name, before.length, schema.options.method, schema.options.path);

  }

    // 捕捉出错信息
    apiRouter.use((err, req, res, next) => {
      debug('api error: %j', err && err.stack || err);
      processOutput(err, null, req, res, next);
    });

    if (this.api.getOption('port')) {
      const port = this.api.getOption('port');
      debug('listen port %s', port)
      app.listen(port);
    }
  };

};
