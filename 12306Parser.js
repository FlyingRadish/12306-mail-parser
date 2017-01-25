var ical = require('ical-generator');
var request = require('request');
var util = require('util');
var async = require('async');
var config = require('./config');

function isPaidTicketMail(content) {
    return /所购车票信息如下/.test(content);
}

function isRebookMail(content) {
    return /改签后的车票信息如下/.test(content);
}

function parse(content, cb) {
    if (!content) {
        return;
    }

    var interestedPattern = /(,.*){5},票价\d+.\d{2}元/g;
    var timePattern = /\d{4}年\d{1,2}月\d{1,2}日\d{2}:\d{2}开/;
    var tripPattern = /[\u4e00-\u9fa5]*—[\u4e00-\u9fa5]*/;
    var trainNumberPattern = /.*次列车/;
    var seatPattern = /.*车.*号/;

    var tickets = [];

    while ((result = interestedPattern.exec(content)) != null) {
        var infos = result[0].split(',');
        var ticket = {};
        for (var i = 0; i < infos.length; i++) {
            if (timePattern.test(infos[i])) {
                var timeStr = converToISO8601(infos[i].replace('开', ''));
                ticket['departureTime'] = new Date(timeStr);
            } else if (tripPattern.test(infos[i])) {
                var tripInfos = infos[i].split('—');
                ticket['from'] = tripInfos[0];
                ticket['to'] = tripInfos[1];
            } else if (trainNumberPattern.test(infos[i])) {
                ticket['trainNumber'] = infos[i].replace('次列车', '');
            } else if (seatPattern.test(infos[i])) {
                ticket['seat'] = infos[i];
            }
        }
        tickets.push(ticket);
    }

    if (tickets.length > 0) {
        var tasks = [];
        console.log('ticket size:%d', tickets.length);
        if (config.api) {
            tickets.forEach(function(ticket) {
                var timeStr = ticket['departureTime'].toISOString();
                var timeStr = timeStr.substring(0, timeStr.indexOf('T'));
                var url = util.format(config.api + '?train=%s&date=%s',
                    ticket['trainNumber'],
                    timeStr);
                tasks.push(queryAsync(url, ticket));
            });

            async.series(tasks, function functionName(err, result) {
                if (err) {
                  console.log(err);
                  cb(err);
                } else {
                  cb(null, {
                      attachments: createICal(tickets).toString(),
                      text: JSON.stringify(tickets)
                  });
                }
            })
        } else {
            cb(null, {
                attachments: createICal(tickets).toString(),
                text: JSON.stringify(tickets)
            });
        }
    }
}

function queryAsync(url, ticket) {
    return function(cb) {
        // console.log(url);
        request(url, function(err, res, body) {
            body = JSON.parse(body);
            if (err || !body.ok) {
                console.log('erro when finding arrive time with ', ticket);
                cb(null, null);
            } else {
                for (var i = 0; i < body.data.length; i++) {
                    var info = body.data[i];
                    if (info.station_name == ticket['to']) {
                        ticket['arriveTime'] = new Date(info.timeStamp);
                        break;
                    }
                }
                if (!ticket['arriveTime']) {
                    console.log('no arrive time with ', ticket);
                }
                cb(null, info);
            }
        })
    }
}

function createICal(tickets) {
    cal = ical({
        domain: 'houxg.github.com',
        name: '12306 Calendar',
        timezone: 'Asia/Hong_Kong',
        method: 'request'
    });
    for (var i = 0; i < tickets.length; i++) {
        var ticket = tickets[i];
        var event = cal.createEvent({
            start: ticket['departureTime'],
            summary: ticket['trainNumber'] + ' ' + ticket['from'] + '-' + ticket['to'],
            description: '',
            timestamp: ticket['departureTime'],
            location: ticket['seat'],
        });
        if (ticket['arriveTime']) {
            event.end(ticket['arriveTime']);
        }
    }
    return cal;
}

function converToISO8601(time) {
    time = time.replace('年', '-');
    time = time.replace('月', '-');
    time = time.replace('日', 'T');
    time += '+08:00';
    return time;
}

module.exports = {
    parse: parse,
    isPaidTicketMail: isPaidTicketMail,
    isRebookMail: isRebookMail
};
