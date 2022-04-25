require("dotenv").config();
// const express = require("express");
// const cors = require("cors");
// const bodyParser = require("body-parser");
// const routers = require("./routes");
// const app = express();
// const port = 3000;

const mysql = require('mysql');

// mysql 접속 설정
const conn = {  
    host: 'spartarealdb.ccdieiaoicbb.ap-northeast-2.rds.amazonaws.com',
    port: '3306',
    user: 'sparta_real',
    password: 'sparta.2022!',
    database: 'sparta_realDB'
};;

let connection = mysql.createConnection(conn); // DB 커넥션 생성
connection.connect();


var testQuery = "INSERT INTO `User` (`userName`,`password`) VALUES ('test','test');";
 
connection.query(testQuery, function (err, results, fields) { // testQuery 실행
    if (err) {
        console.log(err);
    }
    console.log(results);
});
 
testQuery = "SELECT * FROM User";
 
connection.query(testQuery, function (err, results, fields) { // testQuery 실행
    if (err) {
        console.log(err);
    }
    console.log(results);
});
 
 
connection.end(); // DB 접속 종료

//


// // 미들웨어 (가장 상위에 위치)
// const requestMiddleware = (req, res, next) => {
//     console.log('Request URL:', req.originalUrl, ' - ', new Date());
//     next();
// }

// app.use(cors());
// app.use(express.static("static"))
// app.use(express.urlencoded({extended: false}))
// app.use(express.json());
// app.use(bodyParser.json())
// app.use(bodyParser.urlencoded({extended: true}))

// app.use(requestMiddleware);


// app.use('/api', routers);

// //도메인
// app.listen(port, () => {
//   console.log(port, '포트로 서버가 켜졌어요!')
// }); 
