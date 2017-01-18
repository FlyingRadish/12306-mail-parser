var ical = require('ical-generator');
var config = {
    alarmType: 'audio',
    trigger: 60 * 60 //1 hour before event
};

function parse(content) {
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
        return {
            attachments: createICal(tickets).toString(),
            text: JSON.stringify(tickets)
        }
    }
}

function createICal(tickets) {
    cal = ical({
        domain: 'houxg.github.com',
        name: '12306 Calendar',
        timezone: 'Asia/Hong_Kong'
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
        var alarm = event.createAlarm({
            type: config.alarmType,
            trigger: config.trigger
        });
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
    parse: parse
};
