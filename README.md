# 12306-mail-parser
把12306邮件转化为日历文文件（iCal）
# 工作机制
这段代码会定时检查一个特定邮箱，将其中的12306邮件解析并转化为iCal文件。这个iCal文件会作为附件发送给发件方，因此，你可以把它作为一个服务运行。
# 使用方法
1. 配置邮箱信息，编辑`index.js`文件：
```
var config = {
    repeatInMinute: 20,
    email: 'youemail@gmail.com',
    password: 'yourpassword',
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
This script will check the specific inbox periodicity, if 12306's mail exist, then parse the content of mail, and generate correspoding iCal file, then send back to the sender. which means, it can be a service.

# Useage
1. Edit your inbox configuration in `index.js`:
```
var config = {
    repeatInMinute: 20,
    email: 'youemail@gmail.com',
    password: 'yourpassword',
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
```
2. It's highly recommended that using `forever` to run script as a deamon service.
```
npm install
npm install -g forever
forever start index.js
```
