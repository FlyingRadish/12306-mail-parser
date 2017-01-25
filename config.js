var util = require('util')

var config = {
    repeatInMinute: 5, //查询间隔时间，单位分钟
    email: 'youemail@gmail.com', //邮箱地址
    password: 'yourpassword', //邮箱密码
    api: util.format('http://localhost:%d/api/schedule', process.env.API_PORT || '3000'), //列车时刻表API，如没有可以为空
    imap: {
        host: 'imap.gmail.com',
        port: 993,
        ssl: true
    },
    smtp: {
        host: 'smtp.gmail.com',
        port: 465,
        ssl: true
    }
}

module.exports = config;
