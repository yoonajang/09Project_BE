const mysql = require('mysql');
// require('dotenv').config();

// mysql 접속 설정
const db = mysql.createConnection({
    host: process.env.host,
    port: process.env.port,
    user: process.env.user,
    password: process.env.password,
    database: process.env.database,
    multipleStatements : true,  /*다중 쿼리 요청을 가능하게 하기 위해 필요한 속성*/
});

db.connect();

module.exports = db;
