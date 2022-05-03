const express = require('express');
const router = express.Router();
const db = require('../config');
const moment = require('moment');
require('moment-timezone');
moment.tz.setDefault('Asia/seoul');

const authMiddleware = require('../middlewares/auth');

const upload = require('../S3/s3');

//게시글 작성
router.post('/postadd', authMiddleware, upload.single('image'), (req, res, next) => {
        const {title, content, price, headCount, category, endTime, address, lat, lng, } = req.body

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

        db.query(sql, datas, (err, rows) => {
            if (err) {
                console.log(err);
                res.status(201).send({ msg: 'fail' });
            } else {
                res.status(201).send({ msg: 'success' });
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

module.exports = router;
