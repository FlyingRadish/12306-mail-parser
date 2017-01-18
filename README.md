# 12306-mail-parser
把12306邮件转化为日历文文件（iCal）
# 工作机制
这段代码会定时检查一个特定邮箱，将其中的12306邮件解析并转化为iCal文件。这个iCal文件会作为附件发送给发件方，因此，你可以把它作为一个服务运行。
# 使用方法
强烈建议使用`forever`将之运行为后台服务。
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
It's highly recommended that using `forever` to run script as a deamon service.
```
npm install
npm install -g forever
forever start index.js
```
