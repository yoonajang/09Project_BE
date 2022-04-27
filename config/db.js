const mysql = require('mysql');

// mysql 접속 설정
const db = mysql.createConnection({  
    host: process.env.mysql_host,
    port: '3306',
    user: process.env.mysql_user,
    password: process.env.mysql_pw,
    database: 'sparta_realDB'
});

db.connect();


module.exports = db;