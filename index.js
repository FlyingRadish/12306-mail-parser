var Imap = require('imap'),
    inspect = require('util').inspect;
var MailParser = require('mailparser').MailParser;
var trainTicketParser = require('./12306Parser.js');
var nodemailer = require('nodemailer');
var Configstore = require('configstore');
var schedule = require('node-schedule');
var config = require('./config');
/*
[x] 定时任务
[x] 发送邮件
[x] 生成iCal/csv
[x] 设为已读
[x] 定时轮询
[x] 查到站时间
[ ] 增加识别改签， 过滤退票
*/

var conf = new Configstore('12306MailParser', {
    lastNo: 1,
    failed: []
});

function checkOnce() {
    var imap = new Imap({
        user: config.email,
        password: config.password,
        host: config.imap.host,
        port: config.imap.port,
        tls: config.imap.ssl,
        debug: console.log
    });

    imap.once('ready', function() {
        imap.openBox('INBOX', true, function(err, box) {
            if (err) throw err;
            console.log('openInbox, total:' + box.messages.total + ', lastNo:' + conf.get('lastNo'));
            if (conf.get('lastNo') >= box.messages.total) {
                if (conf.get('lastNo') > box.messages.total) {
                    conf.set('lastNo', box.messages.total)
                }
                imap.end();
                return;
            }
            var seqs = [(conf.get('lastNo') + 1) + ':' + box.messages.total];
            seqs = seqs.concat(conf.get('failed'));
            var currentNo = box.messages.total;
            console.log('fetch mail, param=', seqs);
            var f = imap.seq.fetch(seqs, {
                bodies: '',
                markSeen: true
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
    imap.connect();
}

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

var rule = new schedule.RecurrenceRule();
rule.minute = new schedule.Range(0, 59, config.repeatInMinute);;
schedule.scheduleJob(rule, function() {
    console.log(new Date(), 'Start a new job');
    checkOnce();
});
