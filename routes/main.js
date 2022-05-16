const express = require('express');
const router = express.Router();
const db = require('../config');
const mysql = require('mysql');
const moment = require('moment');
require('moment-timezone');
moment.tz.setDefault('Asia/seoul');

const authMiddleware = require('../middlewares/auth');
const upload = require('../S3/s3');

//----------------메인 게시글-----------------//

// 메인페이지 게시글 불러오기
router.post('/postlist', (req, res) => {
    const address = req.body.address.split(' ');
    const userId = req.body.userId;
    const range = req.body.range;
    console.log(range, 'range', userId, 'userId');

    let findAddr = '';
    for (let i = 0; i < range; i++) {
        const addAddr = address[i] + ' ';
        findAddr = findAddr + addAddr;
    }

    if (userId) {
        const sql =
            "SELECT P.postId, P.User_userId, P.title, P.content, P.writer, P.price, P.headCount, P.category, P.isDone, P.image, P.lat, P.lng, P.address, P.createdAt, P.endTime, GROUP_CONCAT( DISTINCT U.userId SEPARATOR ',') headList, CASE WHEN GROUP_CONCAT(L.User_userId) is null THEN false ELSE true END isLike FROM `Post` P LEFT OUTER JOIN `JoinPost` JP ON P.postId = JP.Post_postId and isPick=1 LEFT OUTER JOIN `User` U ON JP.User_userId = U.userId LEFT OUTER JOIN `Like` L ON L.Post_postId = P.postId and L.User_userId = ? WHERE `address` like ? and isDone = 0 GROUP BY P.postId, P.User_userId, P.title, P.content, P.writer, P.price, P.headCount, P.category, P.isDone, P.image, P.lat, P.lng, P.address, P.createdAt, P.endTime ORDER BY P.createdAt DESC";

        db.query(sql, [userId, findAddr + '%'], (err, data) => {
            if (err) console.log(err);
            for (list of data) {
                let head = list.headList;
                let newList = [];

                if (isNaN(Number(head))) {
                    newList.push(list.User_userId);
                    head.split(',').map(id => newList.push(Number(id)));
                    list.headList = newList;
                } else {
                    newList.push(list.User_userId);
                    list.headList = newList;
                }
            }
            res.send({ msg: 'success', data });
        });
    } else {
        const sql =
            "SELECT P.postId, P.User_userId, P.title, P.content, P.writer, P.price, P.headCount, P.category, P.isDone, P.image, P.lat, P.lng, P.address, P.createdAt, P.endTime, GROUP_CONCAT( DISTINCT U.userId SEPARATOR ',') headList FROM `Post` P LEFT OUTER JOIN `JoinPost` JP ON P.postId = JP.Post_postId and isPick=1 LEFT OUTER JOIN `User` U ON JP.User_userId = U.userId WHERE `address` like ? and isDone = 0 GROUP BY P.postId, P.User_userId, P.title, P.content, P.writer, P.price, P.headCount, P.category, P.isDone, P.image, P.lat, P.lng, P.address, P.createdAt, P.endTime ORDER BY P.createdAt DESC";

        db.query(sql, [findAddr + '%'], (err, data) => {
            if (err) console.log(err);
            for (list of data) {
                let head = list.headList;
                let newList = [];

                if (isNaN(Number(head))) {
                    newList.push(list.User_userId);
                    head.split(',').map(id => newList.push(Number(id)));
                    list.headList = newList;
                } else {
                    newList.push(list.User_userId);
                    list.headList = newList;
                }
            }
            res.send({ msg: 'success', data });
        });
    }
});


//----------------게시글-----------------//

// 게시글 조회
router.get('/:postId', (req, res) => {
    const postId = req.params.postId;
    

    const sql =
        "SELECT P.postId, P.User_userId, P.title, P.content, P.writer, P.price, P.headCount, P.category, P.isDone, P.image, P.lat, P.lng, P.address, P.createdAt, P.endTime, GROUP_CONCAT( DISTINCT U1.userId SEPARATOR ',') headList, U.userName, U.userImage FROM `Post` P  JOIN `User` U ON P.User_userId = U.userId LEFT OUTER JOIN `JoinPost` JP ON P.postId = JP.Post_postId and JP.isPick = 1 LEFT OUTER JOIN `User` U1 ON JP.User_userId = U1.userId LEFT OUTER JOIN `User` U2 ON P.User_userId = U2.userId WHERE `postId`= ? GROUP BY P.postId, P.User_userId, P.title, P.content, P.writer, P.price, P.headCount, P.category, P.isDone, P.image, P.lat, P.lng, P.address, P.createdAt, P.endTime, U.userName, U.userImage";

    db.query(sql, postId, (err, data) => {
        if (err) console.log(err);
        let head = data[0].headList;
        if (isNaN(Number(head))) {
            data[0].headList = head.split(',').map(id => Number(id));
        } else {
            let newList = [];
            newList.push(Number(head));
            data[0].headList = newList;
        }

        res.send({ msg: 'success', data });
    });
});

// 게시글 작성
router.post(
    '/postadd',
    authMiddleware,
    upload.single('image'),
    (req, res, next) => {
        
        const {
            title,
            content,
            price,
            headCount,
            category,
            endTime,
            address,
            lat,
            lng,
        } = req.body;
        console.log(endTime, 'endTime')

        const writer = res.locals.user.userName;
        const User_userId = res.locals.user.userId;

        const image = req.file?.location;
        const endTimeAdd = moment(endTime).add("1439","m").format("YYYY-MM-DD HH:mm:ss")

        const datas = [
            title,
            content,
            price,
            headCount,
            category,
            endTimeAdd,
            address,
            lat,
            lng,
            writer,
            User_userId,
            image,
        ];

        const sql =
            'INSERT INTO Post (`title`, `content`, `price`, `headCount`, `category`, `endTime`, `address`, `lat`, `lng`, `writer`, `User_userId`, `image`, `isDone`) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,false)';

        db.query(sql, datas, (err, rows) => {
            if (err) {
                console.log(err);
                res.status(201).send({ msg: 'fail' });
            } else {
                const postId = rows.insertId;
                
                db.query('INSERT INTO `JoinPost` (`User_userId`, `Post_postId`,`isLogin`) VALUES (?,?,?)', [User_userId, postId,0], (err, rows) => {       
                    console.log('게시물 생성 및 JoinPost완료')            
                })

                db.query(
                    'SELECT P.postId, P.User_userId, P.title, P.content, P.writer, P.price, P.headCount, P.category, P.isDone, P.image, P.lat, P.lng, P.address, P.createdAt, P.endTime, CASE WHEN GROUP_CONCAT(L.User_userId) is null THEN false ELSE true END isLike FROM `Post` P LEFT OUTER JOIN `User` U ON P.User_userId = U.userId LEFT OUTER JOIN `Like` L ON L.Post_postId = P.postId and L.User_userId = ? WHERE `postId`= ? GROUP BY P.postId, P.User_userId, P.title, P.content, P.writer, P.price, P.headCount, P.category, P.isDone, P.image, P.lat, P.lng, P.address, P.createdAt, P.endTime', [User_userId, postId],
                    (err, row) => {
                        res.status(201).send({ msg: 'success', row });
                    },
                );
            }
        });
    },
);

// 게시글 삭제
router.delete('/:postId', authMiddleware, (req, res, next) => {
    const postId = req.params.postId;
    const userId = res.locals.user.userId;
    const sql = 'DELETE FROM Post WHERE postId=?';

    db.query(sql, postId, function (err, result) {
        if (err) {
            console.log(err);
            res.status(201).send({ msg: 'fail' });
        } else {
            const sql = 'UPDATE User SET point = point-3 WHERE userId=?';
            db.query(sql, userId, function (err, result) {
                res.status(201).send({ msg: 'success' });
            });
        }
    });
});

// 게시글 거래완료
router.put('/:postId', authMiddleware, (req, res) => {
    const postId = req.params.postId;
    const userId = res.locals.user.userId;

    const sql =
        'UPDATE `Post` SET `isDone`= 1 WHERE `postId`=? AND `User_userId`=?';
    const param = [postId, userId];

    db.query(sql, param, function (err, result) {
        if (err) console.log(err);
        else {
            const sql = 'UPDATE User SET point = point+3 WHERE userId=?';
            db.query(sql, userId, function (err, result) {
                res.send({ msg: 'success' });
            });
        }

    });
});


//----------------채팅-----------------//

// 채팅 시작하기
router.get('/getchat/:postid', authMiddleware, (req, res) => {
    const postId = req.params.postid;
    const userEmail = res.locals.user.userEmail;
    const userName = res.locals.user.userName;
    const userImage = res.locals.user.userImage;
    const userId = res.locals.user.userId;

    //waitingUser table 데이터 넣기
    // 유저인포 방장만 빼고 보내주면 됨. 
    const sql_1 =
        'INSERT INTO JoinPost (Post_postId, User_userEmail, User_userName, userImage, User_userId, isPick, isLogin, isConnected) SELECT ?,?,?,?,?,?,?,? FROM DUAL WHERE NOT EXISTS (SELECT User_userId FROM JoinPost WHERE User_userId = ? and Post_postId = ?);';
    const params = [
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

    const sql_1s = mysql.format(sql_1, params);

    //waitingUser table 데이터 불러오기
    const sql_2 = 'SELECT JP.joinId, JP.createdAt, JP.isPick, JP.userImage, JP.isLogin, JP.socketId, JP.Post_postId, JP.User_userId, JP.User_userEmail, JP.User_userName FROM `JoinPost` JP LEFT OUTER JOIN `Post` P ON JP.Post_postId = P.postId WHERE JP.Post_postId = ? AND JP.User_userId NOT IN (P.User_userId) GROUP BY JP.joinId, JP.createdAt, JP.isPick, JP.userImage, JP.isLogin, JP.socketId, JP.Post_postId, JP.User_userId, JP.User_userEmail, JP.User_userName;';
    const sql_2s = mysql.format(sql_2, postId);

    //Chat table 데이터 가져오기
    const sql_3 =
        'SELECT C.chatId, C.Post_postId, C.chat, date_format(C.createdAt, "%Y-%m-%d %T") createdAt, C.User_userId, C.User_userEmail, C.User_userName, C.userImage FROM Chat C WHERE Post_postId=? ORDER BY createdAt DESC LIMIT 200;';
    const sql_3s = mysql.format(sql_3, postId);

    //게시글 작성자 정보 가져오기
    const sql_4 = 'SELECT User_userId FROM Post WHERE postId=?;';
    const sql_4s = mysql.format(sql_4, postId);

    //찐참여자 목록 가져오기
    const sql_5 =
        'SELECT * FROM JoinPost WHERE isPick = 1 and Post_postId = ?;';
    const sql_5s = mysql.format(sql_5, postId);

    db.query(sql_1s + sql_2s + sql_3s + sql_4s + sql_5s, (err, results) => {
        // console.log(results)

        if (err) console.log(err);
        else {
            const userInfo = results[1];
            const chatInfo = results[2].reverse();
            const chatAdmin = results[3];
            const headList = results[4];
            // console.log(chatInfo);
            return res.status(200).send({
                data: { userInfo, chatInfo, chatAdmin, headList },
                message: '채팅 참여자와 메세지 정보가 전달되었습니다',
            });
        }
    });
});

// 채팅 나가기
router.get('/outchat/:postid', authMiddleware, (req, res) => {
    const postId = req.params.postid;
    const userId = res.locals.user.userId;
    const sql = 'DELETE FROM JoinPost WHERE Post_postId=? and User_userId=?';
    const params = [postId, userId];

    db.query(sql, params, (err, data) => {
        if (err) console.log(err);
        res.status(201).send({ msg: 'success', data });
    });
});


//----------------좋아요-----------------//

// 좋아요 생성
router.get('/like/:postId', authMiddleware, (req, res) => {
    const userId = res.locals.user.userId;
    const postId = req.params.postId;

    const sql =
        'SELECT `Post_postId`,`User_userId` FROM `Like` WHERE `Post_postId`=? and `User_userId`=?';

    db.query(sql, [postId, userId], (err, rows) => {
        if (rows.length === 0) {
            const sql =
                'INSERT INTO `Like` (`Post_postId`,`User_userId`) VALUES (?,?)';

            db.query(sql, [Number(postId), userId], (err, like) => {
                if (err) console.log(err);
                res.send({ msg: 'success' });
            });
        } else {
            res.send({ msg: 'fail' });
        }
    });
});

// 좋아요 삭제
router.delete('/like/:postId', authMiddleware, (req, res) => {
    const userId = res.locals.user.userId;
    const postId = req.params.postId;

    const sql =
        'SELECT `Post_postId`,`User_userId` FROM `Like` WHERE `Post_postId`=? and `User_userId`=?';

    db.query(sql, [postId, userId], (err, rows) => {
        if (rows.length !== 0) {
            const sql =
                'DELETE FROM `Like` WHERE `Post_postId`=? and `User_userId`=?';

            db.query(sql, [Number(postId), userId], (err, data) => {
                if (err) console.log(err);
                res.send({ msg: 'success' });
            });
        } else {
            res.send({ msg: 'fail' });
        }
    });
});


module.exports = router;
