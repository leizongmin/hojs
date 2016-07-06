'use strict';

/**
 * hojs
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

import createDebug from 'debug';

/**
 * 创建一个调试输出函数
 *
 * @param {String} name
 * @return {Function}
 */
export function create(name) {
  return createDebug('hojs:' + name);
};

export var core = create('core');
export var schema = create('schema');
export var test = create('test');
export var docs = create('docs');
export var plugin = create('plugin');
export var express = create('express');
