# 12306-mail-parser
把12306邮件转化为日历文文件（iCal）
# 工作机制
这段代码会定时检查指定邮箱，将其中的12306邮件解析并转化为iCal文件。这个iCal文件会作为附件发送给发件方，你可以使用这个服务配合google calendar等使用。
# 使用方法
1. 配置邮箱信息，编辑`config.js`文件：
```
var config = {
    repeatInMinute: 5, //查询间隔时间，单位分钟
    email: 'youemail@gmail.com', //邮箱地址
    password: 'yourpassword', //邮箱密码
    api: util.format('http://localhost:%d/api/schedule', process.env.API_PORT || '3000'), //列车时刻表API，如没有可以为空
    imap: { //imap配置
        host: 'imap.gmail.com',
        port: 993,
        ssl: true
    },
    smtp: { //smtp配置
        host: 'smtp.gmail.com',
        port: 465,
        ssl: true
    }
}
```

2. 强烈建议使用`forever`将之运行为后台服务。
```
npm install
npm install -g forever
forever start index.js
```
--
# EN
Convert 12306 mail into calendar file(iCal)

# How it works?
This script will check the specific inbox periodicity, if 12306's mail exist, then parse the content of mail, and generate correspoding iCal file, then send back to the sender. you can use it to work with google calendar.

# Useage
1. Edit your inbox configuration in `index.js`:
```
var config = {
    repeatInMinute: 5, //interval of checking
    email: 'youemail@gmail.com',
    password: 'yourpassword',
    api: util.format('http://localhost:%d/api/schedule', process.env.API_PORT || '3000'),
    imap: { //imap配置
        host: 'imap.gmail.com',
        port: 993,
        ssl: true
    },
    smtp: { //smtp配置
        host: 'smtp.gmail.com',
        port: 465,
        ssl: true
    }
}
```
2. It's highly recommended that using `forever` to run script as a deamon service.
```
npm install
npm install -g forever
forever start index.js
```
