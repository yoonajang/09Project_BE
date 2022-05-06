require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const routers = require('./routes');
const fs = require('fs');
const http = require('http');

const https = require('https');
const app = express();
const app_http = express();
const port = 3000;
const httpPort = 80;
const httpsPort = 443;

// const db = require('../config');

//소켓
const path = require('path'); //__dirname 쓰기 위해 필요
const server = http.createServer(app); //이 전에 node 기본 모듈 http 불러오기 필요
const socketIO = require('socket.io'); //소켓 라이브러라 불러오기
const moment = require('moment'); //시간 표시를 위해 사용
const res = require('express/lib/response');

const io = socketIO(server, {
    //socketIO에서 server를 담아간 내용을 변수
    cors: {
        origin: '*', //여기에 명시된 서버만 호스트만 내서버로 연결을 허용할거야
        methods: ['GET', 'POST'],
    },
});

app.use(cors());

// 미들웨어 (가장 상위에 위치)
const requestMiddleware = (req, res, next) => {
    console.log('Request URL:', req.originalUrl, '-', new Date());
    next();
};

// app.use(express.static(path.join(__dirname, 'src'))); //채팅연습용
app.use(express.static('static')); //채팅연습끝나면살리기
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(requestMiddleware);

app.use('/', routers);

//소켓
// const chat = io.of('/chat');
io.on('connection', socket => {
    console.log('연결성공')
    //프론트와 연결
    socket.on('chatting', param => {
        //프론트 입력값 받아주는 코드
        //chat table data 입력
        console.log(param)
        return
        const postId = param.postId;
        const sql = 'INSERT INTO Chat (`Post_postId`, `User_userId`, `chat`) VALUES (?,?,?)';

        db.query(sql, data, (err, rows) => {
            if (err) {
                console.log(err);
                res.status(401).send({ msg: '데이터 입력 실패' });
            } else {
                res.status(201).send({ msg: '데이터 입력 성공' });
            }
        });
        //chatRoomUser table data 입력
        const datas = [postId, userId, userEmail, userName, userImage];
        const sqls =
            'INSERT INTO chatRoomUser (`Post_postId`, `User_userId`, `User_userEmail`, `User_userName`, `User_userImage`,) VALUES (?,?,?,?,?)';

        db.query(sqls, datas, (err, rows) => {
            if (err) {
                console.log(err);
                res.status(401).send({ msg: '데이터 입력 실패' });
            } else {
                res.status(201).send({ msg: '데이터 입력 성공' });
            }
        });

        socket.join(postId);
        //room에 join(room이름 = postId)
        chat.to(postId).emit('sendmessage', {
            //room에 join되어 있는 클라이언트에게 전송
            // time: moment(new Date()).format('h:mm A'),
            postId,
            userName,
            userImage,
        });
    });
    socket.on('sendMessage', data => {});
});

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

// http.createServer(app_http).listen(httpPort, () => {
//   console.log('http서버가 켜졌어요!')
// })

// https.createServer(credentials, app).listen(httpsPort, () => {
//   console.log('https서버가 켜졌어요!')
// })

//도메인
server.listen(port, () => {
    console.log(port, '포트로 서버가 켜졌어요!');
});
