require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const routers = require('./routes');
const fs = require('fs');
const http = require('http');

// const db = require('../config');
// const AWS = require('aws-sdk');
const https = require('https');
const app = express();
const app_http = express();
const port = 3000;
const httpPort = 80;
const httpsPort = 443;

//소켓
const socketIo = require('socket.io');
const { Iot, Route53Domains } = require('aws-sdk');
const { SocketAddress } = require('net');
// const server = require('http').createServer(app)
const toHttp = http.createServer(app_http)

const io = socketIo(toHttp, {
    cors: {
        origin: "*", //여기에 명시된 서버만 호스트만 내서버로 연결을 허용할거야
        methods: ["GET", "POST"],
    },
})

app.use(cors());

// 미들웨어 (가장 상위에 위치)
const requestMiddleware = (req, res, next) => {
    console.log('Request URL:', req.originalUrl, '-', new Date());
    next();
};

app.use(express.static('static'));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(requestMiddleware);

app.use('/', routers);

app_http.use((req, res, next) => {
    if (req.secure) {
        next();
    } else {
        const to = `https://${req.hostname}:${httpsPort}${req.url}`;
        console.log(to);
        res.redirect(to);
    }
});

app.get(
    '/.well-known/pki-validation/FEFFF8AAD41B2BDD0AC37B8AE376E000.txt',
    (req, res) => {
        res.sendFile(
            __dirname +
                '/.well-known/pki-validation/FEFFF8AAD41B2BDD0AC37B8AE376E000.txt',
        );
    },
);

const credentials = {
    key: fs.readFileSync(__dirname + '/private.key', 'utf8'),
    cert: fs.readFileSync(__dirname + '/certificate.crt', 'utf8'),
    ca: fs.readFileSync(__dirname + '/ca_bundle.crt', 'utf8'),
};

http.createServer(app_http).listen(httpPort, () => {
  console.log('http서버가 켜졌어요!')
})

https.createServer(credentials, app).listen(httpsPort, () => {
  console.log('https서버가 켜졌어요!')
})

//도메인
// app.listen(port, () => {
//     console.log(port, '포트로 서버가 켜졌어요!');
// });



io.on("connection", (socket)=> {
    console.log("연결이되었습니다.")
    socket.on("init", (payload) => {
        console.log(payload)
    })
    socket.on("send message", (item) => {//send message 이벤트 발생
        console.log(item.name + " : " + item.message);
       io.emit("receive message", { name: item.name, message: item.message });
       //클라이언트에 이벤트를 보냄
     });
})

module.exports = app