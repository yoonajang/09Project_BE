const { Server } = require('socket.io');
const db = require('./config');
const mysql = require('mysql');

module.exports = (server) => {
    const io = new Server(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
        },
    });

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
                'UPDATE JoinPost SET isConnected = 1, isLogin = 1, socketId = ? WHERE User_userId=? and Post_postId =?;', 
                [socketId, userId, postId],
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
                            
                            const findUser = 
                                    'SELECT JP.User_userId, JP.isLogin, JP.isConnected FROM `JoinPost` JP WHERE JP.Post_postId = 202;'                   
                                db.query(findUser, postId, (err, foundUser) => {
                                    if(err) console.log(err) 

                                    console.log(foundUser, foundUser[0], foundUser[0].isLogin, '<<<<<<<<<<<<')
                                        // 로그아웃된 사람들에게 메세지 저장하기
                                        if (foundUser[0].isLogin = 0 ) {
                                            console.log('작동하나')

                                        // 로그인되어있지만, 채팅방 이용하지 않는 사람에게 메시지 보내기
                                        } else if(foundUser[0].isLogin === 1 && foundUser[0].isConnected === 0){
                                            console.log('작동하나2')

                                        } else {
                                            console.log(foundUser, '채팅하는 사람이거나, 예외처리가 필요하거나')
                                        }
                                            
                                })








                        //     //로그아웃된 회원들에게 메시지 보내기                            
                        //     const findunLoggedUser = 
                        //         'SELECT JP.User_userId, GROUP_CONCAT( DISTINCT U.userId SEPARATOR ",") unLoggedIds FROM `JoinPost` JP LEFT OUTER JOIN `User` U ON JP.User_userId = U.userId WHERE isLogin=0 AND JP.Post_postId = ?'                   
                        //     db.query(findunLoggedUser, postId, (err, foundUser) => {
                        //         if(err) console.log(err)
    
                        //         if(foundUser[0].User_userId === null){
                        //             console.log(1)
                        //             console.log('메세지 보낼 사람이 없음')
                        //         } else if (foundUser.includes(',')){
                        //             const userIds = foundUser[0].unLoggedIds.split(',').map(Number)
                        //             for (user of userIds) {
                        //                 const Insert_alarm =
                        //                         'INSERT INTO Alarm (`isChecked`, `status`, `User_userEmail`, `User_userId`, `User_userName`, `userImage`) VALUES (?,?,?,?,?,?)';
                                            
                        //                 db.query(Insert_alarm, params, (err, Inserted) => {
                        //                     if (err) console.log(err);
                        //                     console.log(
                        //                         '오프라인 회원들에게 메시지 완료',
                        //                     );
                        //                 });
                        //             }
                        //         } else {
                        //             console.log(3,foundUser)
                        //             const Insert_alarm =
                        //                         'INSERT INTO Alarm (`isChecked`, `status`, `User_userEmail`, `User_userId`, `User_userName`, `userImage`) VALUES (?,?,?,?,?,?)';
                                        
                        //             db.query(Insert_alarm, params, (err, Inserted) => {
                        //                 if (err) console.log(err);
                        //                 console.log('오프라인 회원에게 메시지 완료-!')
                        //             });    
                        //         } 
                        //     });
                        
                            
                        //     //로그인되었지만, 채팅을 이용하지 않는 회원들에게 메시지보내기
                        //     const findunConnectedUser = 
                        //         'SELECT GROUP_CONCAT( DISTINCT U.userId SEPARATOR ",") unConnectedIds FROM `JoinPost` JP LEFT OUTER JOIN `User` U ON JP.User_userId = U.userId WHERE isLogin=1 AND isConnected=0 AND JP.Post_postId = ?'
    
                        //     db.query(findunConnectedUser, postId, (err, foundUser) => {
                        //         if(err) console.log(err)
                        //         const sendUser = foundUser[0].unConnectedIds
    
                        //         if(sendUser === null){
                        //             console.log(sendUser)
                        //             console.log('메세지 보낼 사람이 없음')
                        //         } else if (sendUser.includes(',')) {
                        //             const sendUserIds = sendUser.split(',').map(Number)
                                    
                        //             sendUserIds.forEach((user) => {
                        //                 const Insert_alarm =
                        //                     'INSERT INTO Alarm (`isChecked`, `status`, `User_userEmail`, `User_userId`, `User_userName`, `userImage`) VALUES (?,?,?,?,?,?)';
                                        
                        //                 db.query(Insert_alarm, params, (err, Inserted) => {
                        //                     if (err) console.log(err);
    
                        //                     db.query('SELECT A.alarmId, A.status, date_format(A.createdAt, "%Y-%m-%d %T") createdAt, A.isChecked, A.User_userId, A.User_userEmail, A.User_userName, A.userImage, P.postId FROM `Alarm` A JOIN `Post` P ON P.postId = ? WHERE alarmId=? GROUP BY A.alarmId, A.status, A.createdAt, A.isChecked, A.User_userId, A.User_userEmail, A.User_userName, A.userImage, P.postId', [postId, Inserted.insertId], (err, messageAlarm) => {
                        //                         console.log('잘가니', messageAlarm)
                        //                         socket.to(user).emit('send message alarm',messageAlarm);
                        //                     })
                        //                 });
    
                        //             })
                        //         } else { 
                        //             const Insert_alarm =
                        //                         'INSERT INTO Alarm (`isChecked`, `status`, `User_userEmail`, `User_userId`, `User_userName`, `userImage`) VALUES (?,?,?,?,?,?)';
                                        
                        //                 db.query(Insert_alarm, params, (err, Inserted) => {
                        //                     if (err) console.log(err);
    
                        //                     db.query('SELECT A.alarmId, A.status, date_format(A.createdAt, "%Y-%m-%d %T") createdAt, A.isChecked, A.User_userId, A.User_userEmail, A.User_userName, A.userImage, P.postId FROM `Alarm` A JOIN `Post` P ON P.postId = ? WHERE alarmId=? GROUP BY A.alarmId, A.status, A.createdAt, A.isChecked, A.User_userId, A.User_userEmail, A.User_userName, A.userImage, P.postId', [postId, Inserted.insertId], (err, messageAlarm) => {
                                                
                        //                         console.log(sendUser,'에게 감!')
                        //                         socket.send(`${sendUser}`, '에게 감')
    
                        //                         console.log(messageAlarm)
                        //                         socket.to(sendUser).emit('send message alarm',messageAlarm);
                        //                 })
                        //             });
                        //         }
    
                        //     });
                        }
                        // socket.to(postid).emit('receive message', param.newMessage);
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
            const userEmail = param.selectedUser.User_userEmail;
            const userName = param.selectedUser.User_userName;
            const userImage = param.selectedUser.userImage;
    
            const sql_1 =
                'UPDATE JoinPost SET isPick = 1, updatedAt = now() WHERE Post_postId=? and User_userId=?;';
            const data = [postId, userId];
            const sql_1s = mysql.format(sql_1, data);
     
            const sql_2 =
                'SELECT JP.joinId, JP.createdAt, JP.isPick, JP.userImage, JP.isLogin, JP.socketId, JP.Post_postId, JP.User_userId, JP.User_userEmail, JP.User_userName FROM `JoinPost` JP LEFT OUTER JOIN `Post` P ON JP.Post_postId = P.postId WHERE JP.isPick=1 AND JP.Post_postId =? AND JP.User_userId NOT IN (P.User_userId) GROUP BY JP.joinId, JP.createdAt, JP.isPick, JP.userImage, JP.isLogin, JP.socketId, JP.Post_postId, JP.User_userId, JP.User_userEmail, JP.User_userName ORDER BY JP.updatedAt DESC;';
            const sql_2s = mysql.format(sql_2, postId);
    
            const sql_3 =
                'SELECT * FROM `JoinPost` JP WHERE JP.isPick = 0 and JP.Post_postId = ? ORDER BY JP.updatedAt DESC;';
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
    
            const findPost =
                'SELECT P.User_userId, P.title, JP.isLogin joinedLogin FROM `Post` P JOIN `JoinPost` JP ON P.postId = JP.Post_postId WHERE P.postId =? AND JP.User_userId = ? GROUP BY P.User_userId, P.title, JP.isLogin ';
    
            db.query(findPost, [Number(postId), userId], (err, foundPost) => {
                const title = foundPost[0].title
                const joinedLogin = foundPost[0].joinedLogin
    
                const status = title + ' 게시물에 거래가 확정되었습니다.'
    
                if (joinedLogin === 1){
                    const insertAlarm =
                        'INSERT INTO Alarm (`isChecked`, `status`, `User_userEmail`, `User_userId`, `User_userName`, `userImage`) VALUES (?,?,?,?,?,?)';
                    
                    const insertParam = [1, status, userEmail, userId, userName, userImage]
                
                    db.query(insertAlarm, insertParam, (err, Inserted) => {
                        if (err) console.log(err);
    
                        db.query('SELECT A.alarmId, A.status, date_format(A.createdAt, "%Y-%m-%d %T") createdAt, A.isChecked, A.User_userId, A.User_userEmail, A.User_userName, A.userImage, P.postId FROM `Alarm` A JOIN `Post` P ON P.postId = ? WHERE alarmId=? GROUP BY A.alarmId, A.status, A.createdAt, A.isChecked, A.User_userId, A.User_userEmail, A.User_userName, A.userImage, P.postId', [postId, Inserted.insertId], (err, messageAlarm) => {
                            socket.to(userId).emit('added_new_participant',messageAlarm);
                        })
                    });
                } else {
                    const insertAlarm =
                        'INSERT INTO Alarm (`isChecked`, `status`, `User_userEmail`, `User_userId`, `User_userName`, `userImage`) VALUES (?,?,?,?,?,?)';
                    
                    const insertParam = [0, status, userEmail, userId, userName, userImage]
    
                    db.query(insertAlarm, insertParam , (err, Inserted) => {
                        if (err) console.log(err);
                        console.log('오프라인시 저장')
                    });
                }
            });
    
    
        });
    
        //찐참여자 선택 취소 (by 방장)
        socket.on('cancel_new_participant', param => {
            const postid = param.postid;
            const postId = postid.replace('p', '');
            const userId = param.selectedUser.User_userId;
    
            const sql_1 = 
                'UPDATE JoinPost SET isPick = 0, updatedAt = now() WHERE Post_postId=? and User_userId=?;';
            const data = [postId, userId];
            const sql_1s = mysql.format(sql_1, data);
    
            const sql_2 =
                'SELECT JP.joinId, JP.createdAt, JP.isPick, JP.userImage, JP.isLogin, JP.socketId, JP.Post_postId, JP.User_userId, JP.User_userEmail, JP.User_userName FROM `JoinPost` JP LEFT OUTER JOIN `Post` P ON JP.Post_postId = P.postId WHERE JP.isPick=1 AND JP.Post_postId =? AND JP.User_userId NOT IN (P.User_userId) GROUP BY JP.joinId, JP.createdAt, JP.isPick, JP.userImage, JP.isLogin, JP.socketId, JP.Post_postId, JP.User_userId, JP.User_userEmail, JP.User_userName ORDER BY JP.updatedAt DESC;';
            const sql_2s = mysql.format(sql_2, postId);
    
            const sql_3 =
                'SELECT * FROM `JoinPost` JP WHERE JP.isPick = 0 and JP.Post_postId = ? ORDER BY JP.updatedAt DESC;';
            const sql_3s = mysql.format(sql_3, postId);
    
            db.query(sql_1s + sql_2s + sql_3s, (err, rows) => {
                if (err) {
                    console.log(err);
                } else {
                    const headList = rows[1];
                    const waitList = rows[2];
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
    
        // 방나가기 버튼 눌렀을 때, 
        socket.on('leave chatroom', (postid, user) => {
            const postId = postid.replace('p', '');
            const userId = user;
    
            //방장만 안내가 가기.
            const selectJP = 'SELECT isPick FROM `JoinPost` WHERE `Post_postId`=? and `User_userId`=?'
            db.query(selectJP, [Number(postId), user], (err, selectedJP) => {
                if(err) console.log(err)
                const selectedStatus = selectedJP[0].isPick
                
                if (selectedStatus === 1) {
                    // 방장찾기
                    const findBoss = 'SELECT P.postId, P.User_userId, P.title, JP.User_userName unjoinedName, JP.User_userId unjoinedId, JP.User_userEmail unjoinedEmail, JP.userImage unjoinedImage FROM `Post` P JOIN `JoinPost` JP ON P.postId = JP.Post_postId WHERE P.postId= ? AND JP.User_userId= ? GROUP BY P.postId, P.User_userId, P.title, JP.User_userName, JP.User_userId, JP.User_userEmail, JP.userImage'
    
                    db.query(findBoss, [Number(postId), userId], (err, foundBoss) => {
                        console.log(foundBoss)
                        const bossId = foundBoss[0].User_userId
                        const unjoinedId = foundBoss[0].unjoinedId
                        const unjoinedName = foundBoss[0].unjoinedName
                        const unjoinedEmail = foundBoss[0].unjoinedEmail
                        const unjoinedImage = foundBoss[0].unjoinedImage
                        const title = foundBoss[0].title
    
                        // 방장 로그인상태 찾기
                        db.query('SELECT isLogin FROM `JoinPost` WHERE Post_postId=? AND User_userId=?', [Number(postId), bossId], (err, bossIsLogin) => {
                            const bossStatus = bossIsLogin[0].isLogin
                            const status = title + ' 게시물에서 ' + unjoinedName +'님의 거래가 취소되었습니다.' 
    
                            socket.leave(postid)
                            socket.to(postid).emit('connected', unjoinedName + '님이 퇴장하셨습니다.');
    
                            const deleteJP = 'DELETE FROM `JoinPost` WHERE `Post_postId`=? and `User_userId`=?'
                            db.query(deleteJP, [Number(postId), user], (err, deletedJP) => {
                                if(err) console.log(err)
                                console.log('삭제')
                            })
    
                            const insertParam = [0,status, unjoinedEmail, unjoinedId, unjoinedName, unjoinedImage]
                            const insertAlarm =
                                    'INSERT INTO Alarm (`isChecked`, `status`, `User_userEmail`, `User_userId`, `User_userName`, `userImage`) VALUES (?,?,?,?,?,?)';
    
                            // 방장 로그아웃 상태시 저장
                            if (bossStatus === 0){         
                                db.query(insertAlarm, insertParam, (err, Inserted) => {
                                    if (err) console.log(err);
                                    console.log(
                                        '오프라인 회원들에게 메시지 완료',
                                    );
                                });
    
                            } else {
                                db.query(insertAlarm, insertParam, (err, Inserted) => {
                                    if (err) console.log(err);
    
                                    db.query('SELECT A.alarmId, A.status, date_format(A.createdAt, "%Y-%m-%d %T") createdAt, A.isChecked, A.User_userId, A.User_userEmail, A.User_userName, A.userImage, P.postId FROM `Alarm` A JOIN `Post` P ON P.postId = ? WHERE alarmId=? GROUP BY A.alarmId, A.status, A.createdAt, A.isChecked, A.User_userId, A.User_userEmail, A.User_userName, A.userImage, P.postId', [postId, Inserted.insertId], (err, messageAlarm) => {
                                        socket.to(bossId).emit('leaved chatroom',messageAlarm);
                                    })
    
                                });
                         
                            }
    
                        });
                    });     
                } else {
                    console.log('거래자는 아님!')
                }
            });
    
        })
    
    
        // 강퇴 (by 방장 > 작업필요)
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


}