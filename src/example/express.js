'use strict';

/**
 * hojs example - express
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

import Hojs from 'hojs';

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
