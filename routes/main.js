const express = require('express');
const router = express.Router();
const db = require('../config');
const mysql = require('mysql');

const authMiddleware = require('../middlewares/auth');

const upload = require('../S3/s3');

//게시글 작성
router.post(
    '/postadd',
    authMiddleware,
    // upload.array('image', 5),
    upload.single('image'),
    (req, res, next) => {
        const title = req.body.title;
        const content = req.body.content;
        const price = req.body.price;
        const headCount = req.body.headCount;
        const category = req.body.category;
        const endTime = req.body.endTime;
        const address = req.body.address;
        const lat = Number(req.body.lat);
        const lng = Number(req.body.lng);

        const writer = res.locals.user.userName;
        const User_userId = res.locals.user.userId;

        // const image = [];
        // for (let i = 0; i < req.files.length; i++) {
        //     image.push(req.files[i]?.location);
        // }

        const image = req.file?.location;

        const datas = [
            title,
            content,
            price,
            headCount,
            category,
            endTime,
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
                res.status(401).send({ msg: '글 등록 실패' });
            } else {
                res.status(201).send({ msg: '글 등록 성공' });
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
            res.status(401).send({ msg: '글 삭제 실패' });
        } else {
            res.status(201).send({ msg: '글 삭제 성공' });
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
router.get('/getchat/:postid', authMiddleware, (req, res) => {
    const postId = req.params.postid;
    const userEmail = res.locals.user.userEmail;
    const userName = res.locals.user.userName;
    const userImage = res.locals.user.userImage;
    const userId = res.locals.user.userId;
    //waitingUser table 데이터 넣기
    const sql =
        'INSERT INTO waitingUser (`Post_postId`, `User_userEmail`, `User_userName`, `User_userImage`, `User_userId`) VALUES (?,?,?,?,?);';
    const params = [postId, userEmail, userName, userImage, userId];
    const sqls = mysql.format(sql, params);
    //waitingUser table 데이터 불러오기
    const sql_1 = 'SELECT * FROM waitingUser WHERE Post_postId=?;';
    const sql_1s = mysql.format(sql_1, postId);
    //Chat table 데이터 가져오기
    const sql_2 = 'SELECT * FROM Chat WHERE Post_postId=?;';
    const sql_2s = mysql.format(sql_2, postId);

    db.query(sqls + sql_1s + sql_2s, (err, results) => {
        if (err) console.log(err);
        else {
            const dataInfo = results[0];
            const userInfo = results[1];
            const chatInfo = results[2];
            return res
                .status(200)
                .send({
                    data: { dataInfo, userInfo, chatInfo },
                    message: '채팅 참여자와 메세지 정보가 전달되었습니다',
                });
        }
    });
});

//채팅 나가기
// router.get('/outchat/:postid', authMiddleware, (req, res) => {

// }

module.exports = router;
