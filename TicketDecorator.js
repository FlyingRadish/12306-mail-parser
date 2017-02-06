var VCalendar = require('cozy-ical').VCalendar;
var VEvent = require('cozy-ical').VEvent;
var VTodo = require('cozy-ical').VTodo;
var VAlarm = require('cozy-ical').VAlarm;
var request = require('request');
var util = require('util');
var async = require('async');
var config = require('./config');
var Q = require('q');
var nodemailer = require('nodemailer');

function addArriveTimeAndSchedule(tickets) {
    var later = Q.defer();
    if (!config.api) {
        later.resolve(tickets);
    } else {
        var tasks = [];
        tickets.forEach(function(ticket) {
            var chinaTime = new Date(ticket['departureTime'].getTime() + 8 * 1000 * 3600);
            var timeStr = chinaTime.toISOString();
            timeStr = timeStr.substring(0, timeStr.indexOf('T'));
            var url = util.format(config.api + '?train=%s&date=%s', ticket['trainNumber'], timeStr);
            tasks.push(querySchedule(url, ticket));
        });

        async.series(tasks, function functionName(err, result) {
            if (err) {
                later.reject(err);
            } else {
                later.resolve(result);
            }
        });
    }
    return later.promise;
}

function querySchedule(url, ticket) {
    return function(cb) {
        request(url, function(err, res, body) {
            body = JSON.parse(body);
            if (err || !body.ok) {
                cb('erro when finding arrive time with ' + JSON.stringify(ticket), null);
            } else {
                var schedule = '';
                for (var i = 0; i < body.data.length; i++) {
                    var info = body.data[i];
                    if (info.station_name == ticket['to']) {
                        ticket['arriveTime'] = new Date(info.timeStamp);
                    }
                    schedule += util.format('%s-%s\n', info['station_name'], info['arrive_time']);
                }
                if (!ticket['arriveTime']) {
                    console.log('no arrive time with ', ticket);
                }
                ticket['schedule'] = schedule;
                cb(null, ticket);
            }
        })
    }
}

function generateICal(tickets) {
    var cal = new VCalendar({
        organization: 'ParseThatMail',
        title: '12306 Calendar',
        method: 'request',
        domain: 'houxg.github.com'
    });
    for (var i = 0; i < tickets.length; i++) {
        var ticket = tickets[i];
        var desc = '';
        var arriveTime;
        if (ticket['schedule']) {
            desc = ticket['schedule'];
        }
        if (ticket['arriveTime']) {
            arriveTime = ticket['arriveTime'];
        }
        var vevent = new VEvent({
            stampDate: ticket['departureTime'],
            startDate: ticket['departureTime'],
            endDate: arriveTime,
            summary: ticket['trainNumber'] + ' ' + ticket['from'] + '-' + ticket['to'],
            description: desc,
            location: ticket['seat'],
            timezone: 'Asia/Hong_Kong',
            uid: ticket['trainNumber'] + ticket['departureTime'].toLocaleDateString()
        });
        cal.add(vevent);
    }
    return cal;
}

function writeMail(tickets) {
    var later = Q.defer();
    var ics = generateICal(tickets);
    later.resolve({
        attachments: ics.toString(),
        text: JSON.stringify(tickets)
    });
    return later.promise;
}

function sendMail(sendto, content) {
    var later = Q.defer();
    var transporter = nodemailer.createTransport({
        host: config.smtp.host,
        port: config.smtp.port,
        secure: config.smtp.ssl,
        auth: {
            user: config.email,
            pass: config.password
        }
    });
    var mailOptions = {
        from: '"parsethatmail" <' + config.email + '>', // sender address
        to: sendto, // list of receivers
        subject: '12306MailParser result', // Subject line
        text: content.text,
        attachments: [{
            filename: 'event.ics',
            content: new Buffer(content.attachments, 'utf-8')
        }]
    };
    transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
            later.reject(error);
        } else {
            later.resolve('Message sent: ' + info.response);
        }
    });
    return later.promise;
}

module.exports = {
    addArriveTimeAndSchedule: addArriveTimeAndSchedule,
    writeMail: writeMail,
    sendMail: sendMail
};
