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
    console.log( "ip:", req.ip, "domain:", req.rawHeaders[1], "method:", req.method, "Request URL:", req.originalUrl, "-", new Date() ); next(); 
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
    console.log('연결성공');

    console.log(socket.id, '이 친구 들어왔네!')

    socket.on("socket is connected", (loggedUser) => {
        // console.log(loggedUser)
        socket.join(loggedUser.userId); 
        // console.log(socket.rooms)
    });


    // 채팅시작 
    socket.on('startchat', param => {
        console.log('채팅시작');

        const postid = param.postid;
        const postId = postid.replace('p', '');
        const { userId, userName } = param.loggedUser;

        socket.join(postid); // string ('p' + postId)
        // socket.join(userId);

        // 확인용
        // console.log(io.sockets.adapter.rooms.get(postid), '여려명이 있는지 확인할 수 있나?' )
        // console.log(socket.id)
        // console.log(socket.rooms, '클 라 이 언 트')

        console.log(socket.id,'<<<<<<<<<<<<<<<<<< 채팅 시작시 id')
        const socketId = socket.id
        // const a = io.sockets.adapter.rooms.get(postid)
        // console.log(typeof a)

        // const b = Object.key(a).includes(socket.id)
        // console.log(b, '있으면 true, 없으면 false')
        // console.log( socket.id in b)

        db.query('UPDATE JoinPost SET isLogin = 1, socketId = ? WHERE User_userId=?;', 
        [socketId, userId], (err, rows) => {
            if(err) console.log(err)
            io.to(postid).emit('connected', userName + ' 님이 입장했습니다.');
        });

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
                const find_sql = 'SELECT title FROM Post WHERE postId = ?'
        
                db.query(find_sql, postId, (err, find) => {
                    if(err) console.log(err)
                    else {
                        const title = find[0].title
                         
                        const status =  title + ' 게시물에 메시지가 도착했습니다.'
                        const params = [0, status, userEmail, userId, userName, userImage]

                        const Insert_sql = 'INSERT INTO Alarm (`isChecked`, `status`, `User_userEmail`, `User_userId`, `User_userName`, `userImage`) VALUES (?,?,?,?,?,?)'

                        db.query(Insert_sql, params, (err, data) => {
                            if(err) console.log(err)
                            else {
                                db.query('SELECT * FROM Alarm WHERE `alarmId`=?', data.insertId, 
                                (err, alarmInfo) => {
                                    if (err) console.log(err)
                                    socket.to(postid).emit('receive message', param.newMessage);
                                    
                                    find_sql2 = 'SELECT User_userId FROM JoinPost WHERE isLogin=0 and Post_postId = ?'
                                    db.query(find_sql2, postId, (err, find_userIds) => {
                                        const userIds = find_userIds[0].User_userId
                                        for (userId of userIds ){
                                            socket.to(userId).emit('send alarm', alarmInfo);
                                        }
                                    })
                                })
                            };
                        })        
                    }
                });    
            }
        });
    });

    socket.on('typing', postid => 
        socket.to(postid).emit('typing'));

    socket.on('stop typing', postid =>
        socket.to(postid).emit('stop typing'));
    

    // 알림기능
    // socket.on('pushalarm', param => {
    //     console.log(param)

    //     const postid = param.newMessage.Post_postId;
    //     const postId = postid.replace('p', '');
    //     const userId = param.newMessage.User_userId;
    //     const userName = param.newMessage.User_userName;
    //     const userEmail = param.newMessage.User_userEmail;
    //     const userImage = param.newMessage.userImage;
    //     // const status_num = param.status; //string
    

    //     // if (status_num === '1'){
    //         const find_sql = 'SELECT title FROM Post WHERE postId = ?'
        
    //         db.query(find_sql, postId, (err, title) => {
    //             if(err) console.log(err)
    //             else {
    //                 const status =  title + ' 게시물에 메시지가 도착했습니다.'
    //                 const param = [0, status, userEmail, userId, userName, userImage]

    //                 const Insert_sql = 'INSERT INTO Alarm (`isChecked`, `status`, `User_userEmail`, `User_userId`, `User_userName`, `userIamge`) VALUES (?,?,?,?,?,?)'

    //                 db.query(sql, data, (err, data) => {
    //                     db.query('SELECT * FROM Alarm WHERE `alarmId`=?', data.insertId, 
    //                     (err, alarmInfo) => {
    //                             if (err) console.log(err)
    //                             socket.to(postid).emit('pushalarm',alarmInfo)
    //                     });
    //                 })        
    //             }
    //         });
    //     }


        // if (status_num === '2'){
        //     const find_sql = 'SELECT title FROM Post WHERE postId = ?'
        
        //     db.query(find_sql, postId, (err, title) => {
        //         if(err) console.log(err)
        //         else {
        //             const status =  title + ' 게시물에 메시지가 도착했습니다.'
        //             const param = [0, status, userEmail, userId, userName, userImage]

        //             const Insert_sql = 'INSERT INTO Alarm (`isChecked`, `status`, `User_userEmail`, `User_userId`, `User_userName`, `userIamge`) VALUES (?,?,?,?,?,?)'

        //             db.query(sql, data, (err, data) => {
        //                 db.query('SELECT * FROM Alarm WHERE `alarmId`=?', data.insertId, 
        //                 (err, alarmInfo) => {
        //                         if (err) console.log(err)
        //                         socket.to(postid).emit('pushalarm',alarmInfo)
        //                 });
        //             })        
        //         }
        //     });
        // }




        // // DB 넣기 
        // const sql = 'INSERT INTO Alarm (`isChecked`, `status`, `User_userEmail`, `User_userId`, `User_userName`, `userIamge`) VALUES (?,?,?,?,?,?)'


        // const sql = 'SELECT title, User_userId FROM Post WHERE postId = ?;';
        // const sqls = mysql.format(sql, postId);

        // const sql_1 = 'SELECT User_userId FROM JoinPost WHERE Post_postId = ?;';
        // const sql_1s = mysql.format(sql_1, postId);

        // db.query(sqls + sql_1s,  (err, rows) => {
        //     console.log(rows)
        //     console.log(rows[0], '이것 방장~')
        //     console.log(rows[1], '이것 사람이 여러명~')
     
        //     console.log(socket.rooms)

        //     const chatAdmin = rows[0].User_userId;
        //     const title = rows[0].title;
        //     const {users} = rows[1];
        //     console.log(chatAdmin,title,users)
            // console.log(chatAdmin, users);
            // console.log(!chatAdmin || !{users}, '사람이 있나?')
            // if (!chatAdmin || !{users}) {
            //     // socket.join(postid);
            //     socket.to(chatAdmin).emit('pushalarm', title + '게시글 채팅방에서' + userName + ' 님께서 새로운 채팅을 남겼습니다.');
            //     socket.to({users}).emit('pushalarm', title + '게시글 채팅방에서' + userName + ' 님께서 새로운 채팅을 남겼습니다.');
            // }
    //     });
    // });

    
    //찐참여자 선택
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

    //찐참여자 선택 취소
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

    
    // socket.on('disconnect', (param) => {
    //     const postId = param.postid;
    //     const { userId, userName } = param.loggedUser;

    //     const sql = 'DELETE FROM JoinPost WHERE Post_postId=? and User_userId=?';
    //     const params = [postId, userId];

    //     db.query(sql, params, (err, data) => {
    //         if (err) console.log(err);
    //         res.status(201).send({ msg: 'success', data });
    //     });

    //     console.log(socket.rooms, '나가기전')
    //     socket.leave(postId);
    //     console.log(socket.rooms, '나가기후')
    //     io.to(postId).emit('onDisconnect', userName + ' 님이 퇴장했습니다.');
    // })

    socket.on('leave chatroom', param => {
        console.log(param, '방 나감')
   
        // console.log(socket.rooms, '방 나감22222222')
        socket.leave(param)
        // console.log(socket.rooms, '방 나감2222222222222222222222222222222222')
        // console.log(io.sockets.adapter.rooms.get(param), '나갔나여?' )
        const socketId = socket.id
        console.log(socketId, '이 친구 화면은 아직 안껏고, 방만 나간거야!')
    

        // db.query('UPDATE JoinPost SET isLogin = 0 WHERE Post_postId=? and User_userId=?;', 
        // [postId, userId], (err, rows) => {
        //     if(err) console.log(err)
        // });
    });

    socket.on('disconnect',() => {
        const socketId = socket.id
        db.query('UPDATE JoinPost SET isLogin = 0 WHERE socketId = ?', 
        socketId, (err, rows) => {    
            if(err) console.log(err)
            socket.leave()
            console.log(socketId, '브라우저 종료')            
        });
    });

})

// //도메인
// server.listen(port, () => {
//     console.log(port, '포트로 서버가 켜졌어요!');
// });
