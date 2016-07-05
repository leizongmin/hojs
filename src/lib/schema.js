'use strict';

/**
 * hojs
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

import assert from 'assert';
import pathToRegExp from 'path-to-regexp';
import {getSchemaKey} from './utils';
import {schema as debug} from './debug';

const HAS_BEEN_INITED_ERROR = 'has been inited';
const SUPPORT_METHOD = ['get', 'post', 'put', 'delete']

/**
 * API类
 */
export default class Schema {

  /**
   * 构造函数
   *
   * @param {String} method 请求方法
   * @param {String} path 请求路径
   * @param {Object} sourceFile 源文件路径描述对象
   */
  constructor(method, path, sourceFile) {

    assert(method && typeof method === 'string', '`method` must be string');
    assert(Schema.SUPPORT_METHOD.indexOf(method.toLowerCase()) !== -1, '`method` must be one of ' + Schema.SUPPORT_METHOD);
    assert(path && typeof path === 'string', '`path` must be string');
    assert(path[0] === '/', '`path` must be start with "/"');

    this.options = {
      sourceFile,
      method: method.toLowerCase(),
      path,
      examples: [],
      middlewares: [],
      required: [],
      requiredOneOf: [],
      params: {},
    };

    this.key = getSchemaKey(method, path);
    this._pathTestRegExp = pathToRegExp(path);
    this.inited = false;

    debug('new: %s %s from %s', method, path, sourceFile);
  }

  /**
   * 检查URL是否符合API规则
   *
   * @param {String} method
   * @param {String} path
   * @return {Boolean}
   */
  pathTest(method, path) {
    return this.options.method === method.toLowerCase() && this._pathTestRegExp.test(path);
  }

  /**
   * API标题
   *
   * @param {String} title
   * @return {Object}
   */
  title(title) {
    assert(this.inited === false, HAS_BEEN_INITED_ERROR);
    assert(typeof title === 'string', '`title` must be string');
    this.options.title = title;
    return this;
  }

  /**
   * API描述
   *
   * @param {String} description
   * @return {Object}
   */
  description(description) {
    assert(this.inited === false, HAS_BEEN_INITED_ERROR);
    assert(typeof description === 'string', '`description` must be string');
    this.options.description = description;
    return this;
  }

  /**
   * API分组
   *
   * @param {String} group
   * @return {Object}
   */
  group(group) {
    assert(this.inited === false, HAS_BEEN_INITED_ERROR);
    assert(typeof group === 'string', '`group` must be string');
    this.options.group = group;
    return this;
  }

  /**
   * API使用例子
   *
   * @param {Object} example
   *   - {Object} input 输入参数
   *   - {Object} output 输出结果
   * @return {Object}
   */
  example(example) {
    assert(this.inited === false, HAS_BEEN_INITED_ERROR);
    assert(example.input && typeof example.input === 'object', '`input` must be object');
    assert(example.output && typeof example.output === 'object', '`output` must be object');
    this._addExample(example);
    return this;
  }

  _addExample(example) {
    this.options.examples.push(example);
  }

  /**
   * 引入中间件
   *
   * @param {String} name 中间件名称
   * @return {Object}
   */
  use(...list) {
    assert(this.inited === false, HAS_BEEN_INITED_ERROR);
    for (const fn of list) {
      if (typeof fn === 'function') {
        throw new Error('schema.use() does not support unnamed middleware, please use api.registerMiddleware(name, fn) to register the middleware and call schema.use(name) to use it');
      }
      assert(typeof fn === 'string', 'middleware name must be string');
      this.options.middlewares.push(fn);
    }
    return this;
  }

  /**
   * 输入参数
   *
   * @param {String} name 参数名称
   * @param {Object} info
   * @param {Object} params
   * @return {Object}
   */
  param(name, info, params) {

    assert(this.inited === false, HAS_BEEN_INITED_ERROR);

    assert(name && typeof name === 'string', '`name` must be string');
    assert(name.indexOf(' ') === -1, '`name` cannot includes whitespace');
    assert(name[0] !== '$', '`name` cannot start with $');
    assert(!(name in this.options.params), `param ${name} is already exists`);

    assert(info && (typeof info === 'string' || typeof info === 'object'));
    if (typeof info === 'string') info = {type: info, format: true};

    if (!('format' in info)) info.format = true;

    assert(/^[A-Z]/.test(info.type[0]), `type ${info.type} must be start with upper case`);

    if (params) {
      assert(typeof params === 'object', `type checker params must be object`);
    } else {
      params = null;
    }

    if (params) {
      assert(params && !info.params, `please don't pass option "params" in the second parameter when you pass the thrid parameter`);
    }

    info.params = params || info.params;
    this.options.params[name] = info;

    return this;
  }

  /**
   * 必填参数
   *
   * @param {String} name1 参数名称1
   * @param {String} name2 参数名称2（可多个）
   * @return {Object}
   */
  required(...list) {
    assert(this.inited === false, HAS_BEEN_INITED_ERROR);
    for (const item of list) {
      assert(typeof item === 'string', 'required `name` must be string');
      this.options.required.push(item);
    }
    return this;
  }

  /**
   * 多选一必填参数
   *
   * @param {String} name1 参数名称1
   * @param {String} name2 参数名称2（可多个）
   * @return {Object}
   */
  requiredOneOf(...list) {
    assert(this.inited === false, HAS_BEEN_INITED_ERROR);
    for (const item of list) {
      assert(typeof item === 'string', 'required `name` must be string');
    }
    this.options.requiredOneOf.push(list);
    return this;
  }

  /**
   * 注册处理函数
   *
   * @param {Function} fn 函数格式：`async function (params) {}`
   * @return {Object}
   */
  register(fn) {
    assert(this.inited === false, HAS_BEEN_INITED_ERROR);
    assert(typeof fn === 'function', 'register `handler` must be function');
    this.options.handler = fn;
    return this;
  }

  init(parent) {
    assert(this.inited === false, HAS_BEEN_INITED_ERROR);
    const name = this.name = `api ${this.options.method} ${this.options.path}`;
    const before = [];

    if (!this.options.env) {
      assert(this.options.handler, `please register a handler for API ${name}`);
    }

    if (this.options.required.length > 0) {
      before.push((params) => {
        for (const name of this.options.required) {
          if (!(name in params)) {
            throw parent.error('missing_required_parameter', null, {name});
          }
        }
        return params;
      });
    }

    if (this.options.requiredOneOf.length > 0) {
      before.push((params) => {
        for (const names of this.options.requiredOneOf) {
          let ok = false;
          for (const name of names) {
            ok = (name in params);
            if (ok) break;
          }
          if (!ok) {
            throw parent.error('missing_required_parameter', `one of ${names.join(', ')}`, {name})
          }
        }
        return params;
      });
    }

    for (const name in this.options.params) {
      const options = this.options.params[name]
      const typeName = options.type;
      const type = parent.getType(typeName);
      assert(type && type.checker, `please register type ${typeName}`);
      if (options.params) {
        assert(type.paramsChecker(options.params), `test type params failed`);
        try {
          options._paramsJSON = JSON.stringify(options.params);
        } catch (err) {
          throw new Error(`cannot JSON.stringify(options.params) for param ${name}`);
        }
      }
    }

    before.push((params) => {
      const newParams = {};

      // 类型检查与格式化，并且过滤没有定义的参数
      for (const name in params) {
        if (name[0] == '$') {

          // 特例：以 $ 开头的参数不会做任何检查，也意味着这种参数是不可靠的
          newParams[name] = params[name];

        } else {
          try {
            let value = params[name];
            const options = this.options.params[name];
            if (!options) {
              debug('skip undefined param: %s', name);
              continue;
            }
            const type = parent.getType(options.type);

            if (type.parser) {
              value = type.parser(value);
            }

            if (!type.checker(value, options.params)) {
              let msg = `should be valid ${options.type}`;
              if (options.params) {
                msg = `${msg} with additional restrictions: ${options._paramsJSON}`;
              }
              throw parent.error('parameter_error', msg, {name});
            }

            if (options.format && type.formatter) {
              newParams[name] = type.formatter(value, options.params);
            } else {
              newParams[name] = value;
            }

          } catch (err) {
            throw parent.error('parameter_error', err.message, {name});
          }
        }
      }

      // 填充默认值
      for (const name in this.options.params) {
        const options = this.options.params[name];
        const type = parent.getType(options.type);
        if ('default' in options && !(name in newParams)) {
          debug('use default for param %s: %j', name, options.default);
          // TODO: 应该在注册时即检查default值是否合法，以及生成format后的值
          newParams[name] = type.formatter(options.default, options.params);
        }
      }

      return newParams;
    });

    this.inited = true;
    return {name, before, handler: this.options.handler};
  }

}

/* 支持的HTTP请求方法 */
Schema.SUPPORT_METHOD = SUPPORT_METHOD;
