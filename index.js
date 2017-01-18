var Imap = require('imap'),
    inspect = require('util').inspect;
var MailParser = require('mailparser').MailParser;
var trainTicketParser = require('./12306Parser.js');
var nodemailer = require('nodemailer');
var Configstore = require('configstore');
var schedule = require('node-schedule');
/*
[x] 定时任务
[x] 发送邮件
[x] 生成iCal/csv
[x] 设为已读
[x] 定时轮询
[ ] 查到站时间
*/

/*
forever start -l /home/will/log/12306MailParser/forever.log -e /home/will/log/12306MailParser/error.log  --spinSleepTime  60000 index.js
*/

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
var conf = new Configstore('12306MailParser', {
    lastNo: 1,
    failed: []
});
var imap = new Imap({
    user: config.email,
    password: config.password,
    host: config.imap.host,
    port: config.imap.port,
    tls: config.imap.ssl
});

imap.once('ready', function() {
    openInbox(true, function(err, box) {
        if (err) throw err;
        var seqs = [conf.get('lastNo') + ':' + box.messages.total];
        seqs = seqs.concat(conf.get('failed'));
        var currentNo = box.messages.total;
        var f = imap.seq.fetch(seqs, {
            bodies: ''
        });
        f.on('message', function(msg, seqno) {
            handleMessage(msg, seqno);
        });
        f.once('error', function(err) {
            console.log('Fetch error: ' + err);
        });
        f.once('end', function() {
            console.log('Done fetching all messages!');
            conf.set('lastNo', currentNo);
            imap.end();
        });
    });
});
imap.once('error', function(err) {
    console.log(err);
});

imap.once('end', function() {
    console.log('Connection ended');
    imap.end();
});

function handleMessage(msg, seqno, cb) {
    console.log('handleMessage, #' + seqno);
    var buffer = new Buffer('');
    var mailparser = new MailParser({
        debug: false,
        defaultCharset: 'utf8'
    });
    mailparser.on('end', function(mail) {
        var result = trainTicketParser.parse(mail.text);
        if (result) {
            var receivers = mail.from[0].address;
            sendMail(receivers, result, function(err) {
                if (err) {
                    var failed = conf.get('failed');
                    failed.push(seqno + '');
                    conf.set('failed', failed);
                }
            });
        }
    })
    msg.on('body', function(stream, info) {
        stream.on('data', function(chunk) {
            buffer = Buffer.concat([buffer, chunk])
        });
        stream.once('end', function() {
            mailparser.write(buffer);
            mailparser.end();
        })
    });
}

function sendMail(email, content, callback) {
    var transporter = nodemailer.createTransport({
        host: config.smtp.host,
        port: config.smtp.port,
        secure: config.smtp.ssl, // use SSL
        auth: {
            user: config.email,
            pass: config.password
        }
    });
    var mailOptions = {
        from: '"parsethatmail" <' + config.email + '>', // sender address
        to: email, // list of receivers
        subject: '12306MailParser result', // Subject line
        text: content.text,
        attachments: [{
            filename: 'event.ics',
            content: new Buffer(content.attachments, 'utf-8')
        }]
    };
    transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
            callback(error);
            return console.log(error);
        }
        console.log('Message sent: ' + info.response);
    });
}

function openInbox(readOnly, cb) {
    imap.openBox('INBOX', readOnly, cb);
}

var rule = new schedule.RecurrenceRule();
rule.minute = new schedule.Range(0, 59, config.repeatInMinute);;
schedule.scheduleJob(rule, function() {
    console.log(new Date(), 'Start a new job');
    imap.connect();
});
