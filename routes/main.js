const express = require('express');
const router = express.Router();
const db = require('../config');
<<<<<<< HEAD
const moment = require('moment');
require('moment-timezone');
moment.tz.setDefault('Asia/seoul');
=======
>>>>>>> user_09

const authMiddleware = require('../middlewares/auth');

const upload = require('../S3/s3');

//게시글 작성
<<<<<<< HEAD
router.post('/postadd', authMiddleware, upload.single('image'), (req, res, next) => {
        const {title, content, price, headCount, category, endTime, address, lat, lng, } = req.body
=======
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
>>>>>>> user_09

        const writer = res.locals.user.userName;
        const User_userId = res.locals.user.userId;

<<<<<<< HEAD
        const image = req.file?.location;
        const today = moment();
        const endtime = today.add(endTime, 'days').format();
        
=======
        // const image = [];
        // for (let i = 0; i < req.files.length; i++) {
        //     image.push(req.files[i]?.location);
        // }

        const image = req.file?.location;

>>>>>>> user_09
        const datas = [
            title,
            content,
            price,
            headCount,
            category,
<<<<<<< HEAD
            endtime,
=======
            endTime,
>>>>>>> user_09
            address,
            lat,
            lng,
            writer,
            User_userId,
            image,
        ];
<<<<<<< HEAD

=======
>>>>>>> user_09
        const sql =
            'INSERT INTO Post (`title`, `content`, `price`, `headCount`, `category`, `endTime`, `address`, `lat`, `lng`, `writer`, `User_userId`, `image`, `isDone`) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,false)';

        db.query(sql, datas, (err, rows) => {
            if (err) {
                console.log(err);
<<<<<<< HEAD
                res.status(201).send({ msg: 'fail' });
            } else {
                res.status(201).send({ msg: 'success' });
=======
                res.status(401).send({ msg: '글 등록 실패' });
            } else {
                res.status(201).send({ msg: '글 등록 성공' });
>>>>>>> user_09
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
<<<<<<< HEAD
            res.status(201).send({ msg: 'fail' });
        } else {
            res.status(201).send({ msg: 'success' });
=======
            res.status(401).send({ msg: '글 삭제 실패' });
        } else {
            res.status(201).send({ msg: '글 삭제 성공' });
>>>>>>> user_09
        }
    });
});

// 메인페이지 게시글 불러오기
<<<<<<< HEAD
router.get('/postlist', (req, res) => {
=======
router.get('/postList', (req, res) => {
>>>>>>> user_09
    const address = req.body.address;
    const sql = 'select * from Post where address=?';

    db.query(sql, address, (err, data) => {
        if (err) console.log(err);
        console.log(data);
        res.status(201).send({ msg: 'success', data });
    });
});

// 메인페이지 게시글 상세보기
<<<<<<< HEAD
router.get('/postdetail', (req, res) => {
=======
router.get('/postDetail', (req, res) => {
>>>>>>> user_09
    const postId = req.body.postId;
    const sql = 'select * from Post where postId=?';

    db.query(sql, postId, (err, data) => {
        if (err) console.log(err);
        res.status(201).send({ msg: 'success', data });
    });
});

module.exports = router;
