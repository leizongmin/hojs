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
}

export const core = create('core');
export const schema = create('schema');
export const test = create('test');
export const docs = create('docs');
export const plugin = create('plugin');

export const serviceDebug = create('service:debug');
export const serviceInfo = create('service:info');
export const serviceLog = create('service:log');
export const serviceError = create('service:error');
