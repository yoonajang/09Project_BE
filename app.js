require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
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
// const connect = require('../config');

const credentials = {
    key: fs.readFileSync(__dirname + '/private.key', 'utf8'),
    cert: fs.readFileSync(__dirname + '/certificate.crt', 'utf8'),
    ca: fs.readFileSync(__dirname + '/ca_bundle.crt', 'utf8'),
};



//소켓
const path = require('path'); //__dirname 쓰기 위해 필요

const server = http.createServer(app)
// const server = https.createServer(
//     credentials, app
//     // key: fs.readFileSync(__dirname + '/private.key'),
//     // cert: fs.readFileSync(__dirname + '/certificate.crt'),
//     // ca: fs.readFileSync(__dirname + '/ca_bundle.crt'),
//     ); //이 전에 node 기본 모듈 http 불러오기 필요


const socketIO = require('socket.io'); //소켓 라이브러리 불러오기
const moment = require('moment'); //시간 표시를 위해 사용
// const res = require('express/lib/response');

const io = socketIO(server, {
    //socketIO에서 server를 담아간 내용을 변수에 넣기
    cors: {
        origin: '*', //여기에 명시된 서버만 호스트만 내서버로 연결을 허용할거야
        methods: ['GET', 'POST'],
        credentials: true,
    },
});

app.use(cors());

// 미들웨어 (가장 상위에 위치)
const requestMiddleware = (req, res, next) => {
    console.log('Request URL:', req.originalUrl, '-', new Date());
    next();
};

// app.use(express.static(path.join(__dirname, 'src'))); //채팅연습용
app.use(helmet());
app.use(express.static('static')); //채팅연습끝나면살리기
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(requestMiddleware);

app.use('/', routers);

//소켓
// io.on('connection', socket => {
//     console.log('연결성공');
//     //메세지 주고 받기
//     socket.on('sendmessage', param => {
//         //프론트 입력값 받아주는 코드
//         //chat table data 입력
//         console.log(param);
//         const postId = param.postId;
//         const userId = param.userId;
//         const userName = param.userName;
//         const userImage = param.userImage;
//         const chat = param.chat;
//         const sql =
//             'INSERT INTO Chat (`Post_postId`, `User_userId`, `User_userName`, `userImage`, `chat`) VALUES (?,?,?,?,?)';
//         const data = [postId, userId, userName, userImage, chat];

//         db.query(sql, data, (err, rows) => {
//             if (err) {
//                 console.log(err);
//             } else {
//                 //해당 게시글 채팅방에 메세지 전송
//                 socket.join(postId);
//                 //room에 join(room이름 = postId)
//                 io.to(postId).emit('sendmessage', {
//                     //room에 join되어 있는 클라이언트에게 전송
//                     time: moment(new Date()).format('h:mm A'),
//                     userName,
//                     userImage,
//                     chat,
//                 });
//             }
//         });

        
//     });
//     //거래할 유저 선택
//     socket.on('userpick', pick => {
//         const postId = pick.postId;
//         const userId = pick.userId;

//         const sql = 'UPDATE JoinPost SET isPick = "True" WHERE Post_postId=? and User_userId=?';
//         const data = [postId, userId];

//         db.query(sql, data, (err, rows) => {
//             if (err) {
//                 console.log(err);
//                 res.status(401).send({ msg: '수정 실패' });
//             } else {
//                 res.status(201).send({ msg: 'isPick이 수정되었습니다', rows });
//             }
//         });
//     })
// });

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


socketIO(https.createServer(credentials, app));

http.createServer(app_http).listen(httpPort, () => {
  console.log('http서버가 켜졌어요!')
})

https.createServer(credentials, app).listen(httpsPort, () => {
    console.log('https서버가 켜졌어요!')
  })

io.on('connection', socket => {
    if(err) console.log(err)
    console.log('연결성공');
    //메세지 주고 받기
    socket.on('sendmessage', param => {
        //프론트 입력값 받아주는 코드
        //chat table data 입력
        console.log(param);
        const postId = param.postId;
        const userId = param.userId;
        const userName = param.userName;
        const userImage = param.userImage;
        const chat = param.chat;
        const sql =
            'INSERT INTO Chat (`Post_postId`, `User_userId`, `User_userName`, `userImage`, `chat`) VALUES (?,?,?,?,?)';
        const data = [postId, userId, userName, userImage, chat];

        db.query(sql, data, (err, rows) => {
            if (err) {
                console.log(err);
            } else {
                //해당 게시글 채팅방에 메세지 전송
                socket.join(postId);
                //room에 join(room이름 = postId)
                io.to(postId).emit('sendmessage', {
                    //room에 join되어 있는 클라이언트에게 전송
                    time: moment(new Date()).format('h:mm A'),
                    userName,
                    userImage,
                    chat,
                });
            }
        });

        
    });
    //거래할 유저 선택
    socket.on('userpick', pick => {
        const postId = pick.postId;
        const userId = pick.userId;

        const sql = 'UPDATE JoinPost SET isPick = "True" WHERE Post_postId=? and User_userId=?';
        const data = [postId, userId];

        db.query(sql, data, (err, rows) => {
            if (err) {
                console.log(err);
                res.status(401).send({ msg: '수정 실패' });
            } else {
                res.status(201).send({ msg: 'isPick이 수정되었습니다', rows });
            }
        });
    })
});


//도메인
// server.listen(port, () => {
//     console.log(port, '포트로 서버가 켜졌어요!');
// });
