const express = require('express');
const router = express.Router();
const db = require('../config');
const mysql = require('mysql');

const authMiddleware = require('../middlewares/auth');


// 채팅 시작하기
router.get('/getchat/:postId', authMiddleware, (req, res) => {
    const postId = req.params.postId;
    const userEmail = res.locals.user.userEmail;
    const userName = res.locals.user.userName;
    const userImage = res.locals.user.userImage;
    const userId = res.locals.user.userId;

    //waitingUser table 데이터 넣기
    const sql_1 =
        'INSERT INTO JoinPost (Post_postId, User_userEmail, User_userName, userImage, User_userId, isPick, isLogin, isConnected) SELECT ?,?,?,?,?,?,?,? FROM DUAL WHERE NOT EXISTS (SELECT User_userId FROM JoinPost WHERE User_userId = ? and Post_postId = ?);';
    const param_1 = [
        postId,
        userEmail,
        userName,
        userImage,
        userId,
        0,
        0,
        0,
        userId,
        postId,
    ];

    const sql_1s = mysql.format(sql_1, param_1);

    //waitingUser table 데이터 불러오기
    const sql_2 = 'SELECT JP.joinId, JP.createdAt, JP.isPick, JP.userImage, JP.isLogin, JP.socketId, JP.Post_postId, JP.User_userId, JP.User_userEmail, JP.User_userName FROM `JoinPost` JP LEFT OUTER JOIN `Post` P ON JP.Post_postId = P.postId WHERE JP.Post_postId = ? AND JP.isPick = 0 AND JP.User_userId NOT IN (P.User_userId) GROUP BY JP.joinId, JP.createdAt, JP.isPick, JP.userImage, JP.isLogin, JP.socketId, JP.Post_postId, JP.User_userId, JP.User_userEmail, JP.User_userName;';
    const sql_2s = mysql.format(sql_2, postId);

    //Chat table 데이터 가져오기
    const sql_3 =
        'SELECT C.chatId, C.Post_postId, C.chat, date_format(C.createdAt, "%Y-%m-%d %T") createdAt, C.User_userId, C.User_userEmail, C.User_userName, C.userImage FROM Chat C WHERE Post_postId=? ORDER BY createdAt DESC LIMIT 200;';
    const sql_3s = mysql.format(sql_3, postId);

    //게시글 작성자 정보 가져오기
    const sql_4 = 'SELECT User_userId FROM Post WHERE postId=?;';
    const sql_4s = mysql.format(sql_4, postId);

    db.query(sql_1s + sql_2s + sql_3s + sql_4s, (err, results) => {
        // console.log(results)

        if (err) console.log(err);
        else {
            const userInfo = results[1];
            const chatInfo = results[2].reverse();
            const chatAdmin = results[3];

            //찐참여자 목록 가져오기
            const sql_5 =
            'SELECT * FROM JoinPost WHERE isPick = 1 and Post_postId = ? AND User_userId NOT IN(?)';
            const param_5 = [postId, chatAdmin[0].User_userId]
            db.query(sql_5, param_5, (err, headList) => {
                return res.status(200).send({
                    data: { userInfo, chatInfo, chatAdmin, headList },
                    message: '채팅 참여자와 메세지 정보가 전달되었습니다',
                });           
            })
        }
    });
});


// // 채팅 나가기
// router.get('/outchat/:postid', authMiddleware, (req, res) => {
//     const postId = req.params.postid;
//     const userId = res.locals.user.userId;
//     const sql = 'DELETE FROM JoinPost WHERE Post_postId=? and User_userId=?';
//     const params = [postId, userId];

//     db.query(sql, params, (err, data) => {
//         if (err) console.log(err);
//         res.status(201).send({ msg: 'success', data });
//     });
// });

module.exports = router;