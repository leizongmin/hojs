'use strict';

/**
 * hojs
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

import assert from 'assert';
import {schema as debug} from './debug';
import {MissingRequiredParameterErorr, ParameterTypeError} from './error';

const HAS_BEEN_INITED_ERROR = 'has been inited';

export default class Schema {

  static SUPPORT_METHOD = ['get', 'post', 'put', 'delete'];

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
    this.key = `${method.toUpperCase()} ${path}`;
    this.inited = false;
    debug('new: %s %s from %s', method, path, sourceFile);
  }

  title(title) {
    assert(this.inited === false, HAS_BEEN_INITED_ERROR);
    assert(typeof title === 'string', '`title` must be string');
    this.options.title = title;
    return this;
  }

  description(description) {
    assert(this.inited === false, HAS_BEEN_INITED_ERROR);
    assert(typeof description === 'string', '`description` must be string');
    this.options.description = description;
    return this;
  }

  group(group) {
    assert(this.inited === false, HAS_BEEN_INITED_ERROR);
    assert(typeof group === 'string', '`group` must be string');
    this.options.group = group;
    return this;
  }

  example(example) {
    assert(this.inited === false, HAS_BEEN_INITED_ERROR);
    assert(example.input && typeof example.input === 'object', '`input` must be object');
    assert(example.output && typeof example.output === 'object', '`output` must be object');
    this.options.examples.push(example);
    return this;
  }

  use(...list) {
    assert(this.inited === false, HAS_BEEN_INITED_ERROR);
    for (const fn of list) {
      assert(typeof fn === 'function', 'use `handler` must be function');
      this.middlewares.push(fn);
    }
    return this;
  }

  param(name, type) {
    assert(this.inited === false, HAS_BEEN_INITED_ERROR);
    assert(name && typeof name === 'string', '`name` must be string');
    assert(type && (typeof type === 'string' || typeof type === 'object'));
    assert(!(name in this.options.params), `param ${name} is already exists`);
    if (typeof type === 'string') type = {type, format: true};
    if (!('format' in type)) type.format = true;
    assert(/^[A-Z]/.test(type.type[0]), `type ${type.type} must be start with upper case`);
    this.options.params[name] = type;
    return this;
  }

  params(params) {
    assert(this.inited === false, HAS_BEEN_INITED_ERROR);
    assert(params && typeof params === 'object');
    for (const name in params) {
      this.param(name, params[name]);
    }
    return this;
  }

  required(...list) {
    assert(this.inited === false, HAS_BEEN_INITED_ERROR);
    for (const item of list) {
      assert(typeof item === 'string', 'required `name` must be string');
      this.options.required.push(item);
    }
    return this;
  }

  requiredOneOf(...list) {
    assert(this.inited === false, HAS_BEEN_INITED_ERROR);
    for (const item of list) {
      assert(typeof item === 'string', 'required `name` must be string');
    }
    this.options.requiredOneOf.push(list);
    return this;
  }

  register(fn) {
    assert(this.inited === false, HAS_BEEN_INITED_ERROR);
    assert(typeof fn === 'function', 'register `handler` must be function');
    this.options.handler = fn;
    return this;
  }

  init(parent) {
    assert(this.inited === false, HAS_BEEN_INITED_ERROR);
    const name = this.name = `[${this.options.method}]${this.options.path}`;
    const before = [];

    assert(this.options.handler, `please register a handler for API ${name}`);

    if (this.options.required.length > 0) {
      before.push((params) => {
        for (const name of this.options.required) {
          if (!(name in params)) throw new MissingRequiredParameterErorr(`missing required parameter ${name}`, {name});
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
          if (!ok) throw new MissingRequiredParameterErorr(`missing one of required parameters ${names}`, {name});
        }
        return params;
      });
    }

    for (const name in this.options.params) {
      const typeName = this.options.params[name].type;
      const type = parent.getType(typeName);
      assert(type && type.checker && type.formatter, `please register type ${typeName}`);
    }

    before.push((params) => {
      const newParams = {};
      for (const name in params) {
        const value = params[name];
        const options = this.options.params[name];
        if (!options) {
          debug('skip undefined param: %s', name);
          continue;
        }
        const type = parent.getType(options.type);
        if (!type.checker(value)) throw new ParameterTypeError(`parameter ${name} should be ${options.type}`, {name});
        if (options.format) {
          newParams[name] = type.formatter(value);
        } else {
          newParams[name] = value;
        }
      }
      return newParams;
    });

    this.inited = true;
    return {name, before, handler: this.options.handler};
  }

}
