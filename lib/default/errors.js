'use strict';

/**
 * hojs
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

module.exports = function defaultErrors(error) {

  // 其他错误
  error.register('other_error', {
    description: 'other error',
    status: -1,
  });

  // 缺少参数错误
  error.register('missing_required_parameter', {
    description: 'missing required parameter error',
    status: -2,
    message: (msg, data) => `missing required parameter ${ data.name }${ msg ? ': ' + msg : '' }`,
  });

  // 参数不正确错误
  error.register('parameter_error', {
    description: 'parameter error',
    status: -3,
    message: (msg, data) => `incorrect parameter ${ data.name }${ msg ? ': ' + msg : '' }`,
  });

};
