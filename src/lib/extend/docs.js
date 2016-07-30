'use strict';

/**
 * hojs
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

import fs from 'fs';
import path from 'path';
import assert from 'assert';
import mkdirp from 'mkdirp';
import generateMarkdown from '../plugin/generate_markdown';

export default function () {

  this.api.docs = {};
  const plugins = [];

  /**
   * 获取文档数据
   *
   * @return {Object}
   */
  this.api.docs.data = () => {

    const data = {
      types: {},
      errors: {},
      hooks: {},
      schemas: this.api.$schemas.map(v => v.options),
    };

    // types
    this.type.forEach(item => {
      const t = this.utils.merge(item);
      t.parser = t.parser && t.parser.toString();
      t.checker = t.checker && t.checker.toString();
      t.formatter = t.formatter && t.formatter.toString();
      data.types[t.name] = t;
    });

    // errors
    this.error.forEach(e => {
      data.errors[e.name] = this.utils.merge(e, {message: e.message.toString()});
    });

    // hooks
    this.hook.forEach(fn => {
      data.hooks[fn.options.name] = {
        name: fn.options.name,
        source: fn.toString(),
        sourceFile: fn.options.sourceFile.relative,
        description: fn.options.description,
      };
    });

    const formatOutput = this.api.getOption('formatOutput');
    for (const s of data.schemas) {
      // 格式化输出结果
      if (s.examples) {
        s.examples.forEach(item => {
          const v = item;
          v.output = formatOutput(null, v.output);
        });
      }
      // 不返回绝对文件名
      if (s.sourceFile) {
        s.sourceFile = s.sourceFile.relative;
      }
    }

    return data;
  };

  /**
   * 开始采集输入输出样例
   *
   * @return {Object}
   */
  this.api.docs.takeSample = () => {
    this.api.$flag.saveApiInputOutput = true;
    return this.api.docs;
  };

  /**
   * 生成Markdown文档
   *
   * @return {Object}
   */
  this.api.docs.markdown = () => {
    plugins.push(generateMarkdown);
    return this.api.docs;
  };

  /**
   * 存储文档
   *
   * @param {String} dir 存储目录
   * @return {Object}
   */
  this.api.docs.save = (dir) => {

    assert(typeof dir === 'string' && dir.length > 0, `文档存储目录"${ dir }"格式不正确：必须是字符串类型`);
    mkdirp.sync(dir);

    // 保存 all.json
    const data = this.api.docs.data();
    fs.writeFileSync(path.resolve(dir, 'all.json'), this.utils.jsonStringify(data, 2));

    // 根据插件生成文档
    for (const fn of plugins) {
      fn(data, dir);
    }

    return this.api.docs;
  };

  /**
   * 当进程退出时存储文档
   *
   * @param {String} dir 存储目录
   * @return {Object}
   */
  this.api.docs.saveOnExit = (dir) => {
    process.on('exit', () => {
      this.api.docs.save(dir);
    });
    return this.api.docs;
  };

}
