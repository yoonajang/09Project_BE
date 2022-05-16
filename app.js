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
const { clearCache } = require('ejs');

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
    console.log(
        'ip:',
        req.ip,
        'domain:',
        req.rawHeaders[1],
        'method:',
        req.method,
        'Request URL:',
        req.originalUrl,
        '-',
        new Date(),
    );
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

//----------------소켓-----------------//

io.on('connection', socket => {
    console.log(socket.id, '연결성공');

    socket.on('socket is connected', loggedUser => {
        const socketId = socket.id
        const userId = loggedUser.userId

        db.query(
            'UPDATE JoinPost SET isConnected = 0, isLogin = 1, socketId = ? WHERE User_userId=?;', 
            [socketId, userId],
            (err, rows) => {
                if (err) console.log(err);
            },
        );

        socket.join(userId);
    });

    // 채팅시작
    socket.on('startchat', param => {
        console.log('채팅시작');

        const postid = param.postid;
        const postId = postid.replace('p', '');
        const { userId, userName } = param.loggedUser;

        socket.join(postid); // string ('p' + postId)

        // 확인용
        // console.log(io.sockets.adapter.rooms.get(postid), '여려명이 있는지 확인할 수 있나?' )
        // console.log(socket.id)
        // console.log(socket.rooms, '클 라 이 언 트')

        console.log(socket.id, '<<<<<<<<<<<<<<<<<< 채팅 시작시 id');
        const socketId = socket.id;

        db.query(
            'UPDATE JoinPost SET isConnected = 1 WHERE User_userId=? and Post_postId =?;', 
            [userId, postId],
            (err, rows) => {
                if (err) console.log(err);
            },
        );

        io.to(postid).emit(
            'connected',
            userName + ' 님이 입장했습니다.',
        );
    });

    // 메세지 주고 받기 + 오프라인 사용자들에게 알림
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
                const findTitle = 'SELECT title FROM Post WHERE postId = ?';

                db.query(findTitle, postId, (err, foundTitle) => {
                    if (err) console.log(err);
                    else {
                        const title = foundTitle[0].title
                        const status =  title + ' 게시물에 메시지가 도착했습니다.';
                                const params = [
                                                0,
                                                status,
                                                userEmail,
                                                userId,
                                                userName,
                                                userImage,
                                                ];
                        
                        //로그아웃된 회원들에게 메시지 보내기                            
                        const findunLoggedUser = 
                            'SELECT JP.User_userId, GROUP_CONCAT( DISTINCT U.userId SEPARATOR ",") unLoggedIds FROM `JoinPost` JP LEFT OUTER JOIN `User` U ON JP.User_userId = U.userId WHERE isLogin=0 AND JP.Post_postId = ?'                   
                        db.query(findunLoggedUser, postId, (err, foundUser) => {
                            if(err) console.log(err)

                            if(foundUser === null){
                                console.log(1)
                                console.log('메세지 보낼 사람이 없음')
                            } else if (foundUser.includes(',')){
                                const userIds = foundUser[0].unLoggedIds.split(',').map(Number)
                                for (user of userIds) {
                                    const Insert_alarm =
                                            'INSERT INTO Alarm (`isChecked`, `status`, `User_userEmail`, `User_userId`, `User_userName`, `userImage`) VALUES (?,?,?,?,?,?)';
                                        
                                    db.query(Insert_alarm, params, (err, Inserted) => {
                                        if (err) console.log(err);
                                        console.log(
                                            '오프라인 회원들에게 메시지 완료',
                                        );
                                    });
                                }
                            } else {
                                console.log(3,foundUser)
                                const Insert_alarm =
                                            'INSERT INTO Alarm (`isChecked`, `status`, `User_userEmail`, `User_userId`, `User_userName`, `userImage`) VALUES (?,?,?,?,?,?)';
                                    
                                db.query(Insert_alarm, params, (err, Inserted) => {
                                    if (err) console.log(err);
                                    console.log('오프라인 회원에게 메시지 완료')
                                });    
                            }

                            
                        });
                        
                        //로그인되었지만, 채팅을 이용하지 않는 회원들에게 메시지보내기
                        const findunConnectedUser = 
                            'SELECT GROUP_CONCAT( DISTINCT U.userId SEPARATOR ",") unConnectedIds FROM `JoinPost` JP LEFT OUTER JOIN `User` U ON JP.User_userId = U.userId WHERE isLogin=1 AND isConnected=0 AND JP.Post_postId = ?'

                        db.query(findunConnectedUser, postId, (err, foundUser) => {
                            if(err) console.log(err)
                            const sendUser = foundUser[0].unConnectedIds

                            console.log(sendUser=== null, 'null 임')
                            console.log(sendUser.includes(','), '여러명임')
                            console.log(sendUser, '인수 확인')

                            if(sendUser === null){
                                console.log('1-1')
                                console.log('메세지 보낼 사람이 없음')
                            } else if (sendUser.includes(',')) {
                                console.log('2-1')
                                const sendUserIds = sendUser.split(',').map(Number)
                                console.log(sendUserIds)

                                // for (sendUserId of sendUserIds) {
                                //     console.log(sendUserId, '아니, 반복문이 안됨?')
                                sendUserIds.forEach((user) => socket.to(user).emit('send message alarm', user))

                                // const Insert_alarm =
                                //         'INSERT INTO Alarm (`isChecked`, `status`, `User_userEmail`, `User_userId`, `User_userName`, `userImage`) VALUES (?,?,?,?,?,?)';
                                
                                // db.query(Insert_alarm, params, (err, Inserted) => {
                                //     if (err) console.log(err);
                                //     console.log(Inserted,'그래 찾아보자꾸나..')

                                //     db.query('SELECT * FROM Alarm WHERE alarmId=?', Inserted.insertId, (err, messageAlarm) => {
                                //         console.log(messageAlarm, sendUserIds,'이것을 읽어달라!')
                                //         socket.to(sendUserIds).emit('send message alarm',messageAlarm); // 이거 다시 테스트!!!!
                                //     })
                                // });
                            } else { 
                                console.log('3-1',sendUser)
                                const Insert_alarm =
                                            'INSERT INTO Alarm (`isChecked`, `status`, `User_userEmail`, `User_userId`, `User_userName`, `userImage`) VALUES (?,?,?,?,?,?)';
                                    
                                    db.query(Insert_alarm, params, (err, Inserted) => {
                                        if (err) console.log(err);
                                        console.log(Inserted,'그래 찾아보자꾸나..')

                                        db.query('SELECT * FROM Alarm WHERE alarmId=?', Inserted.insertId, (err, messageAlarm) => {
                                            console.log(sendUser,'에게 감!')
                                            socket.send(`${sendUser}`, '에게 감')
                                            socket.to(sendUser).emit('send message alarm',messageAlarm);
                                    })
                                });
                            }

                        })
                    }
                    socket.to(postid).emit('receive message', param.newMessage);
                });
            }    
        });
    });


    //+++++++최초부분만 전달이 되고, 나중에는 전달이 안됨+++++++//
    // 상대방이 타자칠때 
    socket.on('typing', postid => {
        console.log(postid, '상대방이 타자칠때')
        socket.to(postid).emit('typing')}
   );

    socket.on('stop typing', postid => socket.to(postid).emit('stop typing'));

    // 찐참여자 선택 (by 방장)
    socket.on('add_new_participant', param => {
        console.log(param);
        const postid = param.postid;
        const postId = postid.replace('p', '');
        const userId = param.selectedUser.User_userId;

        const sql_1 =
            'UPDATE JoinPost SET isPick = 1 WHERE Post_postId=? and User_userId=?;';
        const data = [postId, userId];
        const sql_1s = mysql.format(sql_1, data);

        const sql_2 =
            'SELECT * FROM JoinPost WHERE isPick = 1 and Post_postId = ?;';
        const sql_2s = mysql.format(sql_2, postId);

        const sql_3 =
            'SELECT * FROM JoinPost WHERE isPick = 0 and Post_postId = ?;';
        const sql_3s = mysql.format(sql_3, postId);

        db.query(sql_1s + sql_2s + sql_3s, (err, rows) => {
            if (err) {
                console.log(err);
            } else {
                const headList = rows[1];
                const waitList = rows[2];
                console.log(headList);
                socket
                    .to(postid)
                    .emit(
                        'receive_participant_list_after_added',
                        headList,
                        waitList,
                    );
            }
        });
    });

    //찐참여자 선택 취소 (by 방장)
    socket.on('cancel_new_participant', param => {
        const postid = param.postid;
        const postId = postid.replace('p', '');
        const userId = param.selectedUser.User_userId;

        const sql_1 = 
            'UPDATE JoinPost SET isPick = 0 WHERE Post_postId=? and User_userId=?;';
        const data = [postId, userId];
        const sql_1s = mysql.format(sql_1, data);

        const sql_2 =
            'SELECT * FROM JoinPost WHERE isPick = 1 and Post_postId = ?;';
        const sql_2s = mysql.format(sql_2, postId);

        const sql_3 =
            'SELECT * FROM JoinPost WHERE isPick = 0 and Post_postId = ?;';
        const sql_3s = mysql.format(sql_3, postId);

        db.query(sql_1s + sql_2s + sql_3s, (err, rows) => {
            if (err) {
                console.log(err);
            } else {
                const headList = rows[1];
                const waitList = rows[2];
                console.log(headList);
                socket
                    .to(postid)
                    .emit(
                        'receive_participant_list_after_canceled',
                        headList,
                        waitList,
                    );
            }
        });
    });

    // //찐참여자 선택 취소 (본인) ______________보류
    // socket.on('leave chatroom', (postid, user) => {
    //     //방장만 안내가 가기.
    //     const delete_JP = 'DELETE FROM `JoinPost` WHERE `Post_postId`=? and `User_userId`=?'
    //     db.query(delete_JP, [postid, user], (err, data) => {
    //         if(err) console.log(err)

    //         // 방장찾기
    //         const find_roomowner = 'SELECT socketId FROM `JoinPost` WHERE `Post_postId`= ? and `isLogin`= 1 '
    //         db.query(find_user, postid, (err, socketids) => {
    //             socket.leave(postid)
    //             io.to(postid).emit('connected', userName + ' 님이 나가셨습니다.');

    //             console.log(socketids, '이거 잘 찍히는지 확인좀...........ㅠㅠ')
    //             const socketIds = socketids[0]
    //             for (socketId of socketIds){
    //                 io.to(postid).emit('connected', userName + ' 님이 나가셨습니다.'); //
    //             }

    //         });

    //     });

    //     // 메세지

    //     //누가나가는지 메세지 전송
    //     socket.leave(postid)
    //     io.to(postid).emit('connected', userName + ' 님이 나가셨습니다.');
    // })

    // 강퇴 (by 방장, 적용확인 필요)
    socket.on('kickout chatroom', (postid, user) => {
        const deleteJP =
            'DELETE FROM `JoinPost` WHERE `Post_postId`=? and `User_userId`=?';
        db.query(deleteJP, [postid, user], (err, deletedJP) => {
            if (err) console.log(err);

            const findTitle = 'SELECT title FROM `Post` WHERE `Post_postId`=?';
            db.query(findTitle, [postid, user], (err, foundTitle) => {
                if (err) console.log(err);
                else {
                    const status = title + ' 게시물의 거래가 취소되었습니다.';

                    const findIsLogin =
                        'SELECT isLogin, socketId FROM `JoinPost` WHERE `Post_postId`=? and `User_userId`=?';
                    db.query(
                        findIsLogin,
                        [postid, user],
                        (err, foundIsLogin) => {
                            const isLogin = foundIsLogin[0].isLogin;
                            const socketId = foundIsLogin[0].socketId;
                            if (isLogin === 1) {
                                socket
                                    .to(user)
                                    .emit(
                                        'kickedout chatroom',
                                        userName + ' 님이 나가셨습니다.',
                                    ); //
                            } else {
                                const findUser =
                                    'SELECT userEmail, userId, userName, userImage FROM `User` WHERE `User_userId`=?';

                                db.query(findUser, params, (err, foundUser) => {
                                    if (err) console.log(err);
                                    console.log(
                                        foundUser,
                                        '이게 안나오면 안되지. 강퇴by 방장',
                                    );
                                    const userEmail = foundUser[0].userEmail;
                                    const userId = foundUser[0].userId;
                                    const userName = foundUser[0].userName;
                                    const userImage = foundUser[0].userImage;

                                    console.log(
                                        '오프라인 회원에게 강퇴 메시지 완료',
                                    );
                                    const InsertAlarm =
                                        'INSERT INTO Alarm  (`isChecked`, `status`, `User_userEmail`, `User_userId`, `User_userName`, `userImage`) VALUES (?,?,?,?,?,?)';
                                    const params = [
                                        0,
                                        status,
                                        userEmail,
                                        userId,
                                        userName,
                                        userImage,
                                    ];

                                    db.query(
                                        InsertAlarm,
                                        params,
                                        (err, InsertedAlarm) => {
                                            if (err) console.log(err);
                                            console.log(
                                                '오프라인 회원에게 강퇴 메시지 완료',
                                            );
                                        },
                                    );
                                });
                            }
                        },
                    );
                }
            });
        });
    });

    // 채팅방 나가기
    socket.on('close chatroom', (postid, user) => {
        const userId = user.userId
        const userName = user.userName
        const postId = postid.replace('p', '');

        db.query(
            'UPDATE JoinPost SET isConnected = 0 WHERE User_userId=? and Post_postId =?;', 
            [userId, postId],
            (err, rows) => {
                if (err) console.log(err);
            },
        );

        socket.leave(postid)
        io.to(postid).emit('connected', userName + ' 님이 나가셨습니다.');

    });

    // 브라우저 종료
    socket.on('disconnect', () => {
        const socketId = socket.id;

        db.query(
            'UPDATE JoinPost SET isLogin = 0, isConnected = 0 WHERE socketId = ?',
            socketId,
            (err, rows) => {
                if (err) console.log(err);
                socket.leave();
                console.log(socketId, '브라우저 종료');
            },
        );
    });

    //socket.close()
});

// //도메인
// server.listen(port, () => {
//     console.log(port, '포트로 서버가 켜졌어요!');
// });
