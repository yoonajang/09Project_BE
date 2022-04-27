require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const routers = require("./routes");
const db = require("./config/db");
const app = express();
const port = 3000;


// 테스트용
// var testQuery = "INSERT INTO `User` (`userName`,`password`) VALUES ('test','test');";

 
// connection.query(testQuery, function (err, results, fields) { // testQuery 실행
//     if (err) {
//         console.log(err);
//     }
//     console.log(results);
// });

// router.get("challenge/me", async (req, res) => {
//     //authmiddleware 작동필요
//     testQuery = "SELECT * FROM User";

 
//     connection.query(testQuery, function (err, results, fields) { // testQuery 실행
//         if (err) {
//             console.log(err);
//         }
//         console.log(results);
//     });

// });

// testQuery = "SELECT * FROM User";
 
// connection.query(testQuery, function (err, results, fields) { // testQuery 실행
//     if (err) {
//         console.log(err);
//     }
//     console.log(results);
// });
 
 
// db.end(); // DB 접속 종료


// 미들웨어 (가장 상위에 위치)
const requestMiddleware = (req, res, next) => {
    console.log('Request URL:', req.originalUrl, ' - ', new Date());
    next();
}

app.use(cors());
app.use(express.static("static"))
app.use(express.urlencoded({extended: false}))
app.use(express.json());
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))

app.use(requestMiddleware);


app.use('/', routers);
// db.end(); // DB 접속 종료

//도메인
app.listen(port, () => {
  console.log(port, '포트로 서버가 켜졌어요!')
}); 

