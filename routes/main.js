const express = require('express');
const router = express.Router();
const db = require('../config');

const authMiddleware = require('../middlewares/auth');

const upload = require('../S3/s3');
const AWS = require('aws-sdk');
const { is } = require('express/lib/request');
const s3 = new AWS.S3();

//게시글 작성
router.post(
    '/postAdd',
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

        const isDone = 'false';

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
            isDone,
            image,
        ];
        // const datas = {
        //     title: title,
        //     content: content,
        //     price: price,
        //     headCount: headCount,
        //     category: category,
        //     endTime: endTime,
        //     address: address,
        //     lat: lat,
        //     lng: lng,
        //     writer: writer,
        //     User_userId: User_userId,
        //     isDone: isDone,
        //     image: image
        // };
        const sql =
            'INSERT INTO Post (`title`, `content`, `price`, `headCount`, `category`, `endTime`, `address`, `lat`, `lng`, `writer`, `User_userId`, `isDone`, `image`) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)';
        // const sql = "INSERT INTO Post SET ?";

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

module.exports = router;
