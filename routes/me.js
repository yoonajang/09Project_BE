const express = require('express');
const router = express.Router();
const db = require('../config');
const mysql = require('mysql');
const authMiddleware = require('../middlewares/auth');
const path = require('path');
let appDir = path.dirname(require.main.filename);
const upload = require('../S3/s3');

const AWS = require('aws-sdk');
const { Console } = require('console');
const s3 = new AWS.S3();

// 유저 프로필 수정
router.post(
    '/me',
    upload.single('userImage'),
    authMiddleware,
    async (req, res) => {
        
        const { userName, statusMsg } = req.body 
        const userId = res.locals.user.userId;
        const originImage = res.locals.user.reUserImage;

        try {
            const sqlList = [];

            // 이미지변경
            if (req.file){
                const userImage = req.file.transforms[1].location;
                const reUserImage = req.file.transforms[0].location;

                console.log(1)
                // User 테이블 변경
                const sql_1_1 = 
                'UPDATE `User` U SET U.userImage=?, U.reUserImage=? WHERE U.userId=?;'
                const data_1_1 = [userImage, reUserImage, userId]
                const sql_1s_1 = mysql.format(sql_1_1, data_1_1);
                
                // Chat 테이블 변경
                const sql_1_2 = 
                'UPDATE `Chat` C SET C.userImage=? WHERE C.User_userId=?;'
                const data_1_2 = [reUserImage, userId]
                const sql_1s_2 = mysql.format(sql_1_2, data_1_2);

                // JoinPost 테이블 변경
                const sql_1_3 = 
                'UPDATE `JoinPost` JP SET JP.userImage=? WHERE JP.User_userId=?;'
                const data_1_3 = [reUserImage, userId]
                const sql_1s_3 = mysql.format(sql_1_3, data_1_3);
                
                sqlList.push(sql_1s_1 + sql_1s_2 + sql_1s_3)
            }
                
            // 닉네임변경
            if (userName){
                console.log(2)
                // User 테이블 변경    
                const sql_2_1 =
                'UPDATE `User` U SET U.userName = ? WHERE U.userId = ?;';
                const data_2_1 = [userName, userId]
                const sql_2s_1 = mysql.format(sql_2_1, data_2_1);

                // JoinPost 테이블 변경  
                const sql_2_2 =
                'UPDATE `JoinPost` JP SET JP.User_userName = ? WHERE JP.User_userId = ?;';
                const data_2_2 = [userName, userId]
                const sql_2s_2 = mysql.format(sql_2_2, data_2_2);

                // Chat 테이블 변경
                const sql_2_3 =
                'UPDATE `Chat` C SET C.User_userName = ? WHERE C.User_userId = ?;';
                const data_2_3 = [userName, userId]
                const sql_2s_3 = mysql.format(sql_2_3, data_2_3);

                // Post 테이블 변경
                const sql_2_4 =
                'UPDATE `Post` P SET P.writer = ? WHERE P.User_userId = ?;';
                const data_2_4 = [userName, userId]
                const sql_2s_4 = mysql.format(sql_2_4, data_2_4);

                // Alarm 테이블 변경
                const sql_2_5 =
                'UPDATE `Alarm` A SET A.User_userName = ? WHERE A.User_userId = ?;';
                const data_2_5 = [userName, userId]
                const sql_2s_5 = mysql.format(sql_2_5, data_2_5);

                sqlList.push(sql_2s_1 + sql_2s_2 + sql_2s_3 + sql_2s_4 + sql_2s_5)
            }

            //상태메시지
            if (statusMsg) {
                console.log(3)
                const sql_3 =
                'UPDATE `User` SET status = ? WHERE userId = ?;';
                const data_3 = [statusMsg, userId]
                const sql_3s = mysql.format(sql_3, data_3);

                sqlList.push(sql_3s)
            }
            

            const saveSql = sqlList.join('')
            db.query(saveSql, (err, rows) => {
                db.query('SELECT * FROM User WHERE userId = ?',userId, (err, foundUser) => {
                    const findUserName = foundUser[0].userName
                    const findStatus = foundUser[0].status
                    const findImage = foundUser[0].reUserImage

                    res.send({ msg: '글 등록 성공', userImage: findImage, statusMsg: findStatus, userName: findUserName });
                })
            });   

        } catch (error) {
            res.status(400).send({ msg: '프로필이 수정되지 않았습니다.' });
        }

    },
);




//유저 마이페이지
// router.get('/:userId', authMiddleware, (req, res) => {
router.get('/:userId', (req, res) => {
    const userId = req.params.userId;


    // 유저 정보
    const userinfo =
        'SELECT U.userId, U.userEmail, U.userName, U.reUserImage userImage, U.tradeCount, U.status statusMsg FROM `User` U WHERE `userId`=?';
    db.query(userinfo, userId, (err, userInfo) => {
        if (err) console.log(err);

    // 유저가 작성한 리스트
    const mylist =
        "SELECT * FROM (SELECT P.postId, P.User_userId userId, P.title, P.content, P.writer, P.price, P.headCount, P.category, P.isDone, P.image, P.address, P.endTime, P.type, GROUP_CONCAT(DISTINCT U1.userId SEPARATOR ',') headList, U1.reUserImage userImage FROM (SELECT * FROM `Post` WHERE User_userId =?) P INNER JOIN (SELECT * FROM `JoinPost` WHERE isPick=1) JP ON P.postId = JP.Post_postId LEFT OUTER JOIN `User` U1 ON JP.User_userId = U1.userId GROUP BY P.postId, P.User_userId, P.title, P.content, P.writer, P.price, P.headCount, P.category, P.isDone, P.image, P.address, P.endTime, P.type) A WHERE headList LIKE ? ORDER BY A.endTime DESC;";

    db.query(mylist, [userId, '%'+userId+'%'], (err, myList) => {
        if (err) console.log(err);
        for (my of myList) {
            let mine = my.headList;
            let mynewList = [];
            if (isNaN(Number(mine))) {
                mine.split(',').map(id => mynewList.push(Number(id)));
                my.headList = mynewList;
            } else if (mine === null) {
                my.headList = mynewList;
            } else if (mine !== null){
                mynewList.push(Number(mine))
                my.headList = mynewList;
            }
        }

    // 유저의 참여한 리스트
    const joinlist =
        "SELECT * FROM (SELECT P.postId, P.User_userId userId, P.title, P.content, P.writer, P.price, P.headCount, P.category, P.isDone, P.image, P.address, P.endTime, P.type, GROUP_CONCAT(DISTINCT U1.userId SEPARATOR ',') headList, U1.reUserImage userImage, JP1.needReview FROM (SELECT * FROM `Post` WHERE User_userId <> ?) P INNER JOIN (SELECT * FROM `JoinPost` WHERE isPick=1) JP ON P.postId = JP.Post_postId LEFT OUTER JOIN `User` U1 ON JP.User_userId = U1.userId LEFT OUTER JOIN (SELECT * FROM `JoinPost` WHERE User_userId = ?) JP1 ON P.postId = JP1.Post_postId GROUP BY P.postId, P.User_userId, P.title, P.content, P.writer, P.price, P.headCount, P.category, P.isDone, P.image, P.address, P.endTime, P.type) A WHERE headList LIKE ? ORDER BY A.endTime DESC;";

    db.query(joinlist, [userId, userId, '%'+userId+'%'], (err, joinList) => {
        if (err) console.log(err);
        for (join of joinList) {
            let joined = join.headList;
            let joinnewList = [];

            if (isNaN(Number(joined))) {
                joined.split(',').map(id => joinnewList.push(Number(id)));
                join.headList = joinnewList;
            } else if (joined === null) {
                join.headList = joinnewList;
            } else if (joined !== null){
                joinnewList.push(Number(joined))
                join.headList = joinnewList;
            }

        }

    // 유저의 좋아요 리스트
    const likelist =
        "SELECT * FROM (SELECT P.postId, P.User_userId userId, P.title, P.content, P.writer, P.price, P.headCount, P.category, P.isDone, P.image, P.address, P.endTime, P.type, GROUP_CONCAT(DISTINCT U1.userId SEPARATOR ',') headList, U1.reUserImage userImage FROM `Post` P INNER JOIN `Like` l ON P.postId = l.Post_postId AND l.User_userId = ? INNER JOIN (SELECT * FROM `JoinPost` WHERE isPick=1) JP ON P.postId = JP.Post_postId LEFT OUTER JOIN `User` U1 ON JP.User_userId = U1.userId GROUP BY P.postId, P.User_userId, P.title, P.content, P.writer, P.price, P.headCount, P.category, P.isDone, P.image, P.address, P.endTime, P.type) A ORDER BY A.endTime DESC;";

    db.query(likelist, userId, (err, likeList) => {
        if (err) console.log(err);
        for (like of likeList) {
            let liked = like.headList;
            let likenewList = [];

            if (isNaN(Number(liked))) {
                liked.split(',').map(id => likenewList.push(Number(id)));
                like.headList = likenewList;
            } else if (liked === null) {
                like.headList = likenewList;
            } else if (liked !== null){
                likenewList.push(Number(liked))
                like.headList = likenewList;
            }
        }

        res.status(201).send({
            msg: 'success',
            userInfo,
            myList,
            joinList,
            likeList,
        });
    });
    });
    });
    });
});

module.exports = router;
