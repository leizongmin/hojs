'use strict';

/**
 * hojs plugin
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

import fs from 'fs';
import path from 'path';
import utils from 'lei-utils';
import {plugin as debug} from '../debug';

export default function (data, dir) {

  function filePath(name) {
    return path.resolve(dir, name + '.md');
  }

  fs.writeFileSync(filePath('types'), typeDocs(data));
  fs.writeFileSync(filePath('errors'), errorDocs(data));

  const list = schemaDocs(data);
  for (const item of list) {
    fs.writeFileSync(filePath(item.name), item.content);
  }

}

function typeDocs(data) {

  const defaultTypes = [];
  const customTypes = [];
  for (const name in data.types) {
    const info = data.types[name];
    if (info.isDefault) {
      defaultTypes.push(info);
    } else {
      customTypes.push(info);
    }
  }

  defaultTypes.sort((a, b) => {
    return a.name > b.name;
  });
  customTypes.sort((a, b) => {
    return a.name > b.name;
  });

  const list = [];
  list.push(`# 默认类型`);
  for (const item of defaultTypes) {
    list.push(`
## ${item.name}
    `.trim());
  }
  list.push(`# 自定义类型`);
  for (const item of defaultTypes) {
    list.push(`
## ${item.name}

${item.description}

检查：

\`\`\`
${item.checker}
\`\`\`

格式化：

\`\`\`
${item.formatter}
\`\`\`
    `.trim());
  }

  return list.join('\n\n');
}

function errorDocs(data) {

  const errors = [];
  for (const name in data.errors) {
    errors.push(data.errors[name]);
  }

  errors.sort((a, b) => {
    return a.name > b.name;
  });

  const list = [];
  list.push('# 错误类型');
  for (const item of errors) {
    list.push(`
## ${item.name}

内容：

\`\`\`
${item.message}
\`\`\`

数据：

\`\`\`
${utils.jsonStringify(item.data, 2)}
\`\`\`
    `.trim());
  }

  return list.join('\n\n');
}

function schemaDocs(data) {

  const group = {};

  function add(name, content) {
    if (!Array.isArray(group[name])) group[name] = [];
    group[name].push(content.trim());
  }

  function middleware(list) {
    return list.map(name => `+ **${name}**`).join('\n');
  }

  function paramsTable(item) {
    const list = [];
    list.push(`参数名 | 类型 | 格式化 | 必填 | 说明`);
    list.push(`------|-----|-------|------|-----`);
    for (const name in item.params) {
      const info = item.params[name];
      let required = '否';
      if (item.required.indexOf(name) !== -1) {
        required = '是';
      } else {
        for (const names of item.requiredOneOf) {
          if (names.indexOf(name) !== -1) {
            required = `${names.join(', ')} 其中一个`
            break;
          }
        }
      }
      list.push(`
${name} | ${info.type} | ${info.format ? '是' : '否'} | ${required} | ${info.comment}
      `.trim());
    }
    return list.join('\n');
  }

  function formatExampleInput(data) {
    data = Object.assign({}, data);
    for (const name in data) {
      if (name[0] === '$') {
        delete data[name];
      }
    }
    return data;
  }

  function examples(list) {
    return list.map(item => {
      return `
input = ${utils.jsonStringify(formatExampleInput(item.input), 2)};
output = ${utils.jsonStringify(item.output, 2)};
      `.trim();
    }).join('\n\n//------------------\n\n');
  }

  for (const item of data.schemas) {
    let str = `
## ${item.title}

源文件：\`${item.sourceFile.relative}\`

请求地址：**${item.method.toUpperCase()}** **${item.path}**

中间件：

${middleware(item.middlewares)}

${paramsTable(item)}
    `;
    if (item.examples.length > 0) {
      str += `
使用示例：

\`\`\`
${examples(item.examples)}
\`\`\`
      `;
    }
    add(item.group, str.trim());
  }

  const list = [];
  for (const name in group) {
    list.push({
      name: name,
      content: group[name].join('\n\n'),
    });
  }

  return list;
}
