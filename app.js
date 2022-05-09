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
const path = require('path');
const { Server } = require('socket.io'); //소켓 라이브러리 불러오기
const mysql = require('mysql');
const moment = require('moment'); //시간 표시를 위해 사용
const db = require('./config');

app.use(cors());

const credentials = {
    key: fs.readFileSync(__dirname + '/private.key', 'utf8'),
    cert: fs.readFileSync(__dirname + '/certificate.crt', 'utf8'),
    ca: fs.readFileSync(__dirname + '/ca_bundle.crt', 'utf8'),
};

const server = https.createServer(credentials, app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});

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

http.createServer(app_http).listen(httpPort, () => {
    console.log('http서버가 켜졌어요!');
});

server.listen(httpsPort, () => {
    console.log('https서버가 켜졌어요!');
});

io.on('connection', socket => {
    console.log('연결성공');

    // 채팅시작 
    socket.on('startchat', param => {
        console.log('채팅시작');
        console.log(param);
        const postId = param.postid;
        const { userId, userName } = param.loggedUser;

        console.log(socket.id);
        socket.join(postId); // string ('p' + postId)
        socket.join(userId);
        console.log(socket.rooms);

        //수찬님 테스트용
        socket.emit('connected', userName + ' 님이 입장했습니다.');
    });

    // 메세지 주고 받기
    socket.on('sendmessage', param => {
        console.log('메세지');
        console.log(param);

        const postid = param.newMessage.Post_postId;
        const postId = postid.replace('p', '');
        const userId = param.newMessage.User_userId;
        const userName = param.newMessage.User_userName;
        const userEmail = param.newMessage.User_userEmail;
        const userImage = param.newMessage.userImage;
        const chat = param.newMessage.chat;
        const createdAt = param.newMessage.createdAt;

        const sql =
            'INSERT INTO Chat (`Post_postId`, `User_userId`, `User_userName`, `User_userEmail`,`userImage`, `chat`) VALUES (?,?,?,?,?,?)';
        const data = [postId, userId, userName, userEmail, userImage, chat];

        db.query(sql, data, (err, rows) => {
            if (err) {
                console.log(err);
            } else {
                //room에 join(room이름 = postId)
                // console.log(param,'<<<<<<<<<<<<<<<<<<<<<<<<<')
                socket.to(postid).emit('receive message', param.newMessage);
            }
        });
    });

    // socket.on('typing', postid => socket.to(postid).emit('typing'));

    // socket.on('stop typing', postid =>
    //     socket.to(postid).emit('stop typing'),
    // );

    //거래할 유저 선택
    // socket.on('userpick', pick => {
    //     console.log(pick)
    //     const postId = pick.postId;
    //     const userId = pick.userId;

    //     const sql =
    //         'UPDATE JoinPost SET isPick = "True" WHERE Post_postId=? and User_userId=?';
    //     const data = [postId, userId];

    //     db.query(sql, data, (err, rows) => {
    //         if (err) {
    //             console.log(err);
    //             res.status(401).send({ msg: '수정 실패' });
    //         } else {
    //             res.status(201).send({ msg: 'isPick이 수정되었습니다', rows });
    //         }
    //     });
    // });

    //찐참여자 선택
    socket.on('add_new_participant', param => {
        console.log(param)
        const postid = param.postid;
        const postId = postid.replace('p', '');
        const userId = param.selectedUser.User_userId;

        const sql =
            'UPDATE JoinPost SET isPick = 1 WHERE Post_postId=? and User_userId=?;';
        const data = [postId, userId];
        const sqls = mysql.format(sql, data);

        const sql_1 =
            'SELECT * FROM JoinPost WHERE isPick = 1 and Post_postId = ?;';
        const sql_1s = mysql.format(sql_1, postId);

        db.query(sqls + sql_1s, (err, rows) => {
            if (err) {
                console.log(err);
            } else {
                const headList = rows[1];
                console.log(headList)
                socket.to(postid).emit('receive_participant_list_after_added', headList);
            }
        });
    });

     //찐참여자 선택 취소
     socket.on('cancel_new_participant', param => {
        console.log('참여자취소',param)
        const postid = param.postid;
        const postId = postid.replace('p', '');
        const userId = param.selectedUser.User_userId;

        const sql =
            'UPDATE JoinPost SET isPick = 0 WHERE Post_postId=? and User_userId=?;';
        const data = [postId, userId];
        const sqls = mysql.format(sql, data);

        const sql_1 =
            'SELECT * FROM JoinPost WHERE isPick = 1 and Post_postId = ? ;';
        const sql_1s = mysql.format(sql_1, postId);

        db.query(sqls + sql_1s, (err, rows) => {
            if (err) {
                console.log(err);
            } else {
                const headList = rows[1];
                console.log(headList)
                socket.to(postid).emit('receive_participant_list_after_canceled', headList);
            
            }
        });
    });
});

//도메인
// server.listen(port, () => {
//     console.log(port, '포트로 서버가 켜졌어요!');
// });
