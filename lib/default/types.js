'use strict';

/**
 * hojs
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

const assert = require('assert');
const validator = require('validator');

module.exports = function defaultTypes(type) {

  type.register('Boolean', {
    checker: (v) => typeof v === 'boolean' || (typeof v === 'string' && validator.isBoolean(v)),
    formatter: (v) => String(v).toLowerCase() === 'true',
    description: '布尔值',
    isDefault: true,
  });

  type.register('Date', {
    checker: (v) => v instanceof Date || (typeof v === 'string' && validator.isDate(v)),
    formatter: (v) => new Date(v),
    description: '日期',
    isDefault: true,
  });

  type.register('String', {
    checker: (v) => typeof v === 'string',
    description: '字符串',
    isDefault: true,
  });

  type.register('TrimString', {
    checker: (v) => typeof v === 'string',
    formatter: (v) => v.trim(),
    description: '自动去首尾空格的字符串',
  });

  type.register('Number', {
    parser: (v) => Number(v),
    checker: (v, p) => {
      const ok = !isNaN(v);
      if (ok && p) {
        if ('min' in p && !(v >= p.min)) return false;
        if ('max' in p && !(v <= p.max)) return false;
      }
      return ok;
    },
    paramsChecker: (params) => {
      if ('max' in params) {
        assert(typeof params.max === 'number', `params.max必须为数值类型，但实际输入为${ params.max }(${ typeof params.max })`);
      }
      if ('min' in params) {
        assert(typeof params.min === 'number', `params.min必须为数值类型，但实际输入为${ params.min }(${ typeof params.min })`);
      }
      if ('max' in params && 'min' in params) {
        assert(params.min < params.max, `params.min必须小于params.max`);
      }
      return true;
    },
    description: '数值',
    isDefault: true,
  });

  type.register('Integer', {
    checker: (v) => validator.isInt(String(v)),
    formatter: (v) => Number(v),
    description: '整数',
    isDefault: true,
  });

  type.register('Float', {
    checker: (v) => validator.isFloat(String(v)),
    formatter: (v) => Number(v),
    description: '浮点数',
    isDefault: true,
  });

  type.register('Object', {
    checker: (v) => v && typeof v === 'object',
    description: '对象',
    isDefault: true,
  });

  type.register('Array', {
    checker: (v) => Array.isArray(v),
    description: '数组',
    isDefault: true,
  });

  type.register('JSON', {
    checker: (v) => typeof v === 'string' && validator.isJSON(v),
    formatter: (v) => JSON.parse(v),
    description: '来源于JSON字符串的对象',
    isDefault: true,
  });

  type.register('JSONString', {
    checker: (v) => typeof v === 'string' && validator.isJSON(v),
    formatter: (v) => v.trim(),
    description: 'JSON字符串',
    isDefault: true,
  });

  type.register('Any', {
    checker: (_) => true,
    description: '任意类型',
    isDefault: true,
  });

  type.register('MongoIdString', {
    checker: (v) => validator.isMongoId(String(v)),
    description: 'MongoDB ObjectId 字符串',
    isDefault: true,
  });

  type.register('Email', {
    checker: (v) => typeof v === 'string' && validator.isEmail(v),
    formatter: (v) => v.trim(),
    description: '邮箱地址',
    isDefault: true,
  });

  type.register('Domain', {
    checker: (v) => typeof v === 'string' && validator.isFQDN(v),
    formatter: (v) => v.trim(),
    description: '域名（比如：domain.com）',
    isDefault: true,
  });

  type.register('Alpha', {
    checker: (v) => typeof v === 'string' && validator.isAlpha(v),
    description: '字母字符串（a-zA-Z）',
    isDefault: true,
  });

  type.register('AlphaNumeric', {
    checker: (v) => typeof v === 'string' && validator.isAlphanumeric(v),
    description: '字母和数字字符串（a-zA-Z0-9）',
    isDefault: true,
  });

  type.register('Ascii', {
    checker: (v) => typeof v === 'string' && validator.isAscii(v),
    description: 'ASCII字符串',
    isDefault: true,
  });

  type.register('Base64', {
    checker: (v) => typeof v === 'string' && validator.isBase64(v),
    formatter: (v) => v.trim(),
    description: 'base64字符串',
    isDefault: true,
  });

  type.register('URL', {
    checker: (v) => typeof v === 'string' && validator.isURL(v),
    formatter: (v) => v.trim(),
    description: 'URL字符串',
    isDefault: true,
  });

};
