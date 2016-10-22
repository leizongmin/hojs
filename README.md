# 轻量级 RESTful API 服务器框架


## 目标

+ 尽可能少编写业务无关的代码
+ 尽可能共享公共部分代码
+ 强类型检查
+ 单元测试
+ 自动根据代码生成精准的API文档
+ 保证最大的灵活性，除基本框架之外，不限制用户使用何种数据库客户端或ORM
+ 支持ES7的async function


## TODO

+ [x] 单元测试框架，example的数据自动从单元测试中获取
+ [ ] 在线REST调试器
+ [x] API文档生成（Markdown）
+ [ ] 内置组件：数据签名、会话管理、AccessToken
+ [ ] 使用文档、教程
+ [x] 基于ho.js的论坛系统
+ [ ] 支持Express和Koa引擎
+ [ ] 调用跟踪与日志


## 安装

```bash
$ npm install hojs --save
```

**注意：仅支持 Node.js v6.0 或更高版本**


## 使用方法

完整项目请参考 [hobbs论坛系统](https://github.com/leizongmin/hobbs)

### 基于Express引擎

需要安装依赖模块：`$ npm install hojs hojs-express --save`

```javascript
'use strict';

const Hojs = require('hojs');

// 创建Hojs实例
const $ = new Hojs({
  path: __dirname,
  engine: 'express',
});

// 注册API
$.api
.get('/')
.param('msg', {
  type: 'TrimString',
  default: '没有提交参数',
  comment: '消息内容',
})
.register(async function (params) {
  return {
    time: new Date(),
    msg: params.msg,
  };
});

// 初始化并监听端口
const host = '127.0.0.1';
const port = process.env.PORT || 3000;
$.initAndListen(host, port, err => {
  if (err) {
    console.error(err.stack || err);
    process.exit(1);
  } else {
    console.log('服务器已启动，监听地址：http://%s:%s', host, port);
  }
});
```


## License

```
The MIT License (MIT)

Copyright (c) 2016 Zongmin Lei <leizongmin@gmail.com>
http://ucdok.com

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
