'use strict';

/**
 * hojs
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

export default function () {

  this.service.register('api.check.params', apiCheckParams);
  this.service.register('api.hook.before', apiHookBefore);
  this.service.register('api.entry', apiEntry);

  const parent = this;

  /**
   * API入口
   */
  function apiEntry(ctx) {
    ctx.series([
      ctx.prepareCall(`api.hook.before`, ctx.params),
      ctx.prepareCall(`api.check.params`),
      ctx.prepareCall(`handler.${ ctx.params.schema }`),
    ], (err, ret) => {
      if (err) return ctx.error(err);
      ctx.result(ret);
    });
  }

  /**
   * 执行before hook
   */
  function apiHookBefore(ctx) {

    const schemaKey = ctx.params.schema;
    if (!schemaKey) return ctx.error(new Error(`内部错误：缺少"schema"参数`));
    const schema = parent.api.$schemaMapping[schemaKey];
    if (!schema) return ctx.error(new Error(`内部错误：schema "${ schemaKey }"不存在`));

    const params = ctx.params.params;
    if (!params) return ctx.error(new Error(`内部错误：缺少"params"参数`));

    if (schema.options.beforeHooks.length < 1) {
      return ctx.result({ schema: schemaKey, params });
    }

    const hooks = [ ctx.prepareCall(`hook.${ schema.options.beforeHooks[0] }`, { schema: schemaKey, params }) ]
                  .concat(schema.options.beforeHooks.slice(1).map(name => ctx.prepareCall(`hook.${ name }`)));
    ctx.series(hooks, (err, ret) => {
      if (err) return ctx.error(err);
      ctx.result({ schema: schemaKey, params: ret.params });
    });
  }

  /**
   * 检查参数
   */
  function apiCheckParams(ctx) {

    const schemaKey = ctx.params.schema;
    if (!schemaKey) return ctx.error(new Error(`内部错误：缺少"schema"参数`));
    const schema = parent.api.$schemaMapping[schemaKey];
    if (!schema) return ctx.error(new Error(`内部错误：schema "${ schemaKey }"不存在`));

    const params = ctx.params.params;
    if (!params) return ctx.error(new Error(`内部错误：缺少"params"参数`));

    // 必填参数检查
    if (schema.options.required.length > 0) {
      for (const name of schema.options.required) {
        if (!(name in params)) {
          return ctx.error(parent.error.new('missing_required_parameter', null, { name }));
        }
      }
    }

    // 可选参数检查
    if (schema.options.requiredOneOf.length > 0) {
      for (const names of schema.options.requiredOneOf) {
        let ok = false;
        for (const name of names) {
          ok = typeof params[name] !== 'undefined';
          if (ok) break;
        }
        if (!ok) {
          return ctx.error(parent.error.new('missing_required_parameter', `one of ${ names.join(', ') }`, { name: names }));
        }
      }
    }

    // 参数值检查，并格式化参数
    const newParams = {};

    // 类型检查与格式化，并且过滤没有定义的参数
    for (const name in params) {
      if (name[0] === '$') {

        // 特例：以 $ 开头的参数不会做任何检查，也意味着这种参数是不可靠的
        newParams[name] = params[name];

      } else {

        let value = params[name];
        const options = schema.options.params[name];
        if (!options) continue;

        const type = parent.type.get(options.type);

        // 如果类型有 parser 则先执行
        if (type.parser) {
          value = type.parser(value);
        }

        // 如果类型有 checker 则检查
        if (!type.checker(value, options.params)) {
          let msg = `should be valid ${ options.type }`;
          if (options.params) {
            msg = `${ msg } with additional restrictions: ${ options._paramsJSON }`;
          }
          return ctx.error(parent.error.new('parameter_error', msg, { name }));
        }

        // 如果类型有 formatter 且开启了 format=true 则格式化参数
        if (options.format && type.formatter) {
          newParams[name] = type.formatter(value, options.params);
        } else {
          newParams[name] = value;
        }
      }
    }

    // 填充默认值
    for (const name in schema.options.params) {
      const options = schema.options.params[name];
      const type = parent.type.get(options.type);
      if ('default' in options && !(name in newParams)) {
        // TODO: 应该在注册时即检查default值是否合法，以及生成format后的值
        newParams[name] = type.formatter(options.default, options.params);
      }
    }

    ctx.result({ schema: schemaKey, params: newParams });
  }

}

