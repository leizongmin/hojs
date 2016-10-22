'use strict';

/**
 * hojs example - express
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

const Hojs = require('../');
const express = require('express');

// 创建Hojs实例
const $ = new Hojs({
  path: __dirname,
  engine: 'express',
});

// 注册API
$.api
.get('/send')
.param('msg', {
  type: 'TrimString',
  default: '没有提交参数',
  comment: '消息内容',
})
.register(function (params, callback) {
  callback(null, {
    time: new Date(),
    msg: params.msg,
  });
});

// 创建express实例
const app = express();

// 将Hojs作为中间件注册到express
app.use($.server.getMiddleware());

app.get('/', function (req, res) {
  res.setHeader('content-type', 'text/html');
  res.end(`
<h1>Hello, Hojs</h1>
<a href="/send?msg=测试内容">测试</a>
  `);
});

// 初始化Hojs
$.init(err => {
  if (err) {
    console.error(err.stack || err);
    process.exit(1);
  }

  // express监听端口
  const port = process.env.PORT || 3000;
  app.listen(port, err => {
    if (err) {
      console.error(err.stack || err);
      process.exit(1);
    } else {
      console.log('服务器已启动，监听地址：http://127.0.0.1:%s', port);
    }
  });
});
