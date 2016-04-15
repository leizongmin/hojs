'use strict';

/**
 * hojs
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

import assert from 'assert';
import registerDefaultTypes from '../default/types';
import {core as debug} from '../debug';

export default function () {

  this.api.getType = (name) => {
    return this.api.$types[name];
  };

  this.api.registerType = (name, {checker, formatter, paramsChecker, description = '', isDefault} = {}) => {
    formatter = formatter || ((v) => v);
    isDefault = !!isDefault;
    assert(name && typeof name === 'string', 'type name must be string');
    assert(/^[A-Z]/.test(name[0]), `type ${name} must be start with upper case`);
    assert(checker && typeof checker === 'function', 'type checker must be function');
    assert(formatter && typeof formatter === 'function', 'type formatter must be function');
    assert(typeof description === 'string', 'type description must be string');
    assert(!(name in this.api.$types), `type ${name} is already exists`);
    if (paramsChecker) {
      assert(typeof paramsChecker === 'function', 'paramsChecker must be function');
    } else {
      paramsChecker = null;
    }
    this.api.$types[name] = {checker, formatter, paramsChecker, description, isDefault};
    if (!isDefault) {
      debug('register type: name=%s, checker=%s, formatter=%s, paramsChecker=%s description=%s',
        name, checker, formatter, paramsChecker, description);
    }
    return this.api;
  };

  registerDefaultTypes(this.api.registerType);

};
