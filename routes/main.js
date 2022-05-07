const express = require('express');
const router = express.Router();
const db = require('../config');
const mysql = require('mysql');
const moment = require('moment');
require('moment-timezone');
moment.tz.setDefault('Asia/seoul');

const authMiddleware = require('../middlewares/auth');

const upload = require('../S3/s3');

//게시글 작성
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

        const writer = res.locals.user.userName;
        const User_userId = res.locals.user.userId;

        const image = req.file?.location;
        const today = moment();
        const endtime = today.add(endTime, 'days').format();

        const datas = [
            title,
            content,
            price,
            headCount,
            category,
            endtime,
            address,
            lat,
            lng,
            writer,
            User_userId,
            image,
        ];

        const sql =
            'INSERT INTO Post (`title`, `content`, `price`, `headCount`, `category`, `endTime`, `address`, `lat`, `lng`, `writer`, `User_userId`, `image`, `isDone`) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,false)';

        console.log(sql);

        db.query(sql, datas, (err, rows) => {
            if (err) {
                console.log(err);
                res.status(201).send({ msg: 'fail' });
            } else {
                console.log(rows.insertId);
                db.query(
                    'SELECT * FROM Post WHERE `postId`=?',
                    rows.insertId,
                    (err, row) => {
                        res.status(201).send({ msg: 'success', row });
                    },
                );
            }
        });
    },
);

//게시글 삭제
router.delete('/:postId', authMiddleware, (req, res, next) => {
    const postId = req.params.postId;
    const sql = 'DELETE FROM Post WHERE postId=?';

    db.query(sql, postId, function (err, result) {
        if (err) {
            console.log(err);
            res.status(201).send({ msg: 'fail' });
        } else {
            res.status(201).send({ msg: 'success' });
        }
    });
});


// 메인페이지 게시글 불러오기
router.get('/postlist', (req, res) => {
    const address = req.body.address;
    const sql = 'select * from Post where address=?';

    db.query(sql, address, (err, data) => {
        if (err) console.log(err);
        console.log(data);
        res.status(201).send({ msg: 'success', data });
    });
});

// 메인페이지 게시글 상세보기
router.get('/postdetail', (req, res) => {
    const postId = req.body.postId;
    const sql = 'select * from Post where postId=?';

    db.query(sql, postId, (err, data) => {
        if (err) console.log(err);
        res.status(201).send({ msg: 'success', data });
    });
});

//채팅 시작하기
router.post('/getchat/:postid', authMiddleware, (req, res) => {
    const postId = req.params.postid;
    const userEmail = res.locals.user.userEmail;
    const userName = res.locals.user.userName;
    const userImage = res.locals.user.userImage;
    const userId = res.locals.user.userId;

    //waitingUser table 데이터 넣기
    const sql =
        'INSERT INTO JoinPost (Post_postId, User_userEmail, User_userName, userImage, User_userId, isPick) SELECT ?,?,?,?,?,? FROM DUAL WHERE NOT EXISTS (SELECT User_userId FROM JoinPost WHERE User_userId = ?);';
    const params = [
        postId,
        userEmail,
        userName,
        userImage,
        userId,
        'false',
        userId,
    ];
    const sqls = mysql.format(sql, params);
    //waitingUser table 데이터 불러오기
    const sql_1 = 'SELECT * FROM JoinPost WHERE Post_postId=?;';
    const sql_1s = mysql.format(sql_1, postId);
    //Chat table 데이터 가져오기
    const sql_2 =
        'SELECT * FROM Chat WHERE Post_postId=? ORDER BY createdAt ASC;';
    const sql_2s = mysql.format(sql_2, postId);
    //게시글 작성자 정보 가져오기
    const sql_3 = 'SELECT User_userId FROM Post WHERE postId=?;';
    const sql_3s = mysql.format(sql_3, postId);

    db.query(sqls + sql_1s + sql_2s + sql_3s, (err, results) => {
        if (err) console.log(err);
        else {
            const userInfo = results[1];
            const chatInfo = results[2];
            const chatAdmin = results[3];
            return res.status(200).send({
                data: { userInfo, chatInfo, chatAdmin },
                message: '채팅 참여자와 메세지 정보가 전달되었습니다',
            });
          
// 메인페이지 게시글 불러오기 (수정)
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
            "SELECT P.postId, P.User_userId, P.title, P.content, P.writer, P.price, P.headCount, P.category, P.isDone, P.image, P.lat, P.lng, P.address, P.createdAt, P.endTime, GROUP_CONCAT(U.userId SEPARATOR ',') headList, CASE WHEN GROUP_CONCAT(L.User_userId) is null THEN false ELSE true END isLike FROM `Post` P LEFT OUTER JOIN `JoinPost` JP ON P.postId = JP.Post_postId LEFT OUTER JOIN `User` U ON JP.User_userId = U.userId LEFT OUTER JOIN `Like` L ON L.Post_postId = P.postId and L.User_userId = ? WHERE `address` like ? and isDone = 0 GROUP BY P.postId, P.User_userId, P.title, P.content, P.writer, P.price, P.headCount, P.category, P.isDone, P.image, P.lat, P.lng, P.address, P.createdAt, P.endTime";
        db.query(sql, [userId, findAddr + '%'], (err, datas) => {
            if (err) console.log(err);
            for (list of datas) {
                let head = list.headList;
                if (isNaN(Number(head))) {
                    list.headList = head.split(',').map(id => Number(id));
                } else {
                    let newList = [];
                    newList.push(Number(head));
                    list.headList = newList;
                }
            }
            const data = datas.reverse();
            res.send({ msg: 'success', data });
        });
    } else {
        const sql =
            "SELECT P.postId, P.User_userId, P.title, P.content, P.writer, P.price, P.headCount, P.category, P.isDone, P.image, P.lat, P.lng, P.address, P.createdAt, P.endTime, GROUP_CONCAT(U.userId SEPARATOR ',') headList FROM `Post` P LEFT OUTER JOIN `JoinPost` JP ON P.postId = JP.Post_postId LEFT OUTER JOIN `User` U ON JP.User_userId = U.userId WHERE `address` like ? and isDone = 0 GROUP BY P.postId, P.User_userId, P.title, P.content, P.writer, P.price, P.headCount, P.category, P.isDone, P.image, P.lat, P.lng, P.address, P.createdAt, P.endTime";

        db.query(sql, [findAddr + '%'], (err, datas) => {
            if (err) console.log(err);
            for (list of datas) {
                let head = list.headList;
                if (isNaN(Number(head))) {
                    list.headList = head.split(',').map(id => Number(id));
                } else {
                    let newList = [];
                    newList.push(Number(head));
                    list.headList = newList;
                }
            }
            const data = datas.reverse();
            res.send({ msg: 'success', data });
        });
    }
});

// 메인페이지 게시글 상세보기
router.get('/:postId', (req, res) => {
    const postId = req.params.postId;

    const sql =
        "SELECT P.postId, P.User_userId, P.title, P.content, P.writer, P.price, P.headCount, P.category, P.isDone, P.image, P.lat, P.lng, P.address, P.createdAt, P.endTime, GROUP_CONCAT(U.userId SEPARATOR ',') headList FROM `Post` P LEFT OUTER JOIN `JoinPost` JP ON P.postId = JP.Post_postId LEFT OUTER JOIN `User` U ON JP.User_userId = U.userId WHERE `postId`=? GROUP BY P.postId, P.User_userId, P.title, P.content, P.writer, P.price, P.headCount, P.category, P.isDone, P.image, P.lat, P.lng, P.address, P.createdAt, P.endTime";

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

//채팅 나가기
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

module.exports = router;
