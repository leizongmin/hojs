'use strict';

/**
 * hojs
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

import assert from 'assert';
import {schema as debug} from './debug';

const HAS_BEEN_INITED_ERROR = 'has been inited';

export default class Schema {

  static SUPPORT_METHOD = ['get', 'post', 'put', 'delete'];

  constructor(method, path) {
    assert(method && typeof method === 'string', '`method` must be string');
    assert(Schema.SUPPORT_METHOD.indexOf(method.toLowerCase()) !== -1, '`method` must be one of ' + Schema.SUPPORT_METHOD);
    assert(path && typeof path === 'string', '`path` must be string');
    assert(path[0] === '/', '`path` must be start with "/"');
    this.options = {
      method: method.toLowerCase(),
      path,
      examples: [],
      middlewares: [],
      required: [],
      requiredOneOf: [],
      params: {},
    };
    this.inited = false;
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
    assert(!(name in this.options.params));
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

  init() {
    assert(this.inited === false, HAS_BEEN_INITED_ERROR);
    const name = this.name = `[${this.options.method}]${this.options.path}`;
    const before = [];

    this.inited = true;
    return {name, before, handler: this.options.handler};
  }

}
