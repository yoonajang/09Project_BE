const mysql = require('mysql');

// mysql 접속 설정
const db = mysql.createConnection({  
    host: 'spartarealdb.ccdieiaoicbb.ap-northeast-2.rds.amazonaws.com',
    port: '3306',
    user: 'sparta_real',
    password: 'sparta.2022!',
    database: 'sparta_realDB'
});

db.connect();

module.exports=db;
