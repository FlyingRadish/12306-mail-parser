var Q = require('q');

function isPaidTicketMail(content) {
    return /所购车票信息如下/.test(content);
}

function isRebookMail(content) {
    return /改签后的车票信息如下/.test(content);
}

var v0 = {
    interestedPattern: '(,.*){5},票价\\d+\\.\\d{2}元',
    timePattern: /\d{4}年\d{1,2}月\d{1,2}日\d{2}:\d{2}开/,
    tripPattern: /[\u4e00-\u9fa5]*—[\u4e00-\u9fa5]*/,
    trainNumberPattern: /.*次列车/,
    seatPattern: /.*车.*号/,
    parseTickts(content) {
        var tickets = [];
        var interestedReg = new RegExp(this.interestedPattern, 'g');
        while ((result = interestedReg.exec(content)) != null) {
            var infos = result[0].split(',');
            var ticket = {};
            for (var i = 0; i < infos.length; i++) {
                if (this.timePattern.test(infos[i])) {
                    var timeStr = converToISO8601(infos[i].replace('开', ''));
                    ticket['departureTime'] = new Date(timeStr);
                } else if (this.tripPattern.test(infos[i])) {
                    var tripInfos = infos[i].split('—');
                    ticket['from'] = tripInfos[0];
                    ticket['to'] = tripInfos[1];
                } else if (this.trainNumberPattern.test(infos[i])) {
                    ticket['trainNumber'] = infos[i].replace('次列车', '');
                } else if (this.seatPattern.test(infos[i])) {
                    ticket['seat'] = infos[i];
                }
            }
            tickets.push(ticket);
        }
        if (tickets.length > 0) {
            return tickets;
        }
    },
    isIntersted(content) {
        return new RegExp(this.interestedPattern).test(content);
    }
}

var v1 = {
    interestedPattern: '\\d\\.([^\s.]+?，){6}票价\\d+\\.\\d{2}元',
    timePattern: /\d{4}年\d{1,2}月\d{1,2}日\d{2}:\d{2}开/,
    tripPattern: /[\u4e00-\u9fa5]*—[\u4e00-\u9fa5]*/,
    trainNumberPattern: /.*次列车/,
    seatPattern: /.*车.*号/,
    parseTickts(content) {
        var tickets = [];
        var interestedReg = new RegExp(this.interestedPattern, 'g');
        while ((result = interestedReg.exec(content)) != null) {
            var infos = result[0].split('，');
            var ticket = {};
            for (var i = 0; i < infos.length; i++) {
                if (this.timePattern.test(infos[i])) {
                    var timeStr = converToISO8601(infos[i].replace('开', ''));
                    ticket['departureTime'] = new Date(timeStr);
                } else if (this.tripPattern.test(infos[i])) {
                    var tripInfos = infos[i].split('—');
                    ticket['from'] = tripInfos[0];
                    ticket['to'] = tripInfos[1];
                } else if (this.trainNumberPattern.test(infos[i])) {
                    ticket['trainNumber'] = infos[i].replace('次列车', '');
                } else if (this.seatPattern.test(infos[i])) {
                    ticket['seat'] = infos[i];
                }
            }
            tickets.push(ticket);
        }
        if (tickets.length > 0) {
            return tickets;
        }
    },
    isIntersted(content) {
        return new RegExp(this.interestedPattern).test(content);
    }
}

var parser = [v0, v1];

function parse(content) {
    var later = Q.defer();
    if (!content) {
        later.reject('content is empty');
    }
    var tickets;
    for (var i = 0; i < parser.length; i++) {
        if (parser[i].isIntersted(content)) {
            tickets = parser[i].parseTickts(content);
            if (tickets) {
                break;
            }
        }
    }
    if (tickets) {
        later.resolve(tickets);
    } else {
        later.reject('cant parse that content');
    }
    return later.promise;
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
