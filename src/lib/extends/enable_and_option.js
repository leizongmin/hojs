'use strict';

/**
 * hojs
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

import assert from 'assert';
import {core as debug} from '../debug';

export default function () {

  this.api.enable = (...list) => {
    for (const name of list) {
      assert(name in this.api.$features, `cannot enable unknown feature "${name}"`);
      this.api.$features[name] = true;
    }
    return this.api;
  };

  this.api.disable = (...list) => {
    for (const name of list) {
      assert(name in this.api.$features, `cannot disable unknown feature "${name}"`);
      this.api.$features[name] = false;
    }
    return this.api;
  };

  this.api.isEnable = (name) => {
    return this.api.$features[name];
  };

  this.api.setOption = (name, value) => {
    this.api.$options[name] = value;
    return this.api;
  };

  this.api.getOption = (name) => {
    return this.api.$options[name];
  };

};
