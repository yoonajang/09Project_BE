const mysql = require('mysql');
// require('dotenv').config();

// mysql 접속 설정
const db = mysql.createConnection({
    host: process.env.host,
    port: process.env.port,
    user: process.env.user,
    password: process.env.password,
    database: process.env.database,
    multipleStatements : true,
});

db.connect();

module.exports = db;
