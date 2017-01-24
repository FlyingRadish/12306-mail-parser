var util = require('util')

var config = {
    repeatInMinute: 5,
    email: 'youemail@gmail.com',
    password: 'yourpassword',
    api: util.format('http://localhost:%d/api/schedule', process.env.API_PORT || '3000'),
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
