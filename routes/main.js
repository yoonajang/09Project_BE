const express = require('express');
const router = express.Router();
const db = require('../config');
const mysql = require('mysql');
const moment = require('moment');
require('moment-timezone');
moment.tz.setDefault('Asia/seoul');

const authMiddleware = require('../middlewares/auth');
const upload = require('../S3/s3');

//
router.get('/', (req, res) => {
    console.log('test입니다.')
})


// 메인페이지 게시글 불러오기
router.post('/postlist', (req, res) => {
    const address = req.body.address.split(' ');
    const userId = req.body.userId;
    const range = req.body.range;
    const lat = req.body.lat;
    const lng = req.body.lng;

    const kmRange = [10, 5, 1.5];
    let km = kmRange[range - 1];

    let findAddr = '';
    for (let i = 0; i < range; i++) {
        const addAddr = address[i] + ' ';
        findAddr = findAddr + addAddr;
    }

    if (userId) {
        const sql =
            "SELECT P.postId, P.User_userId, P.title, P.content, P.writer, P.price, P.headCount, P.category, P.isDone, P.image, P.lat, P.lng, P.address, P.createdAt, P.endTime, GROUP_CONCAT( DISTINCT U.userId SEPARATOR ',') headList, CASE WHEN GROUP_CONCAT(L.User_userId) is null THEN false ELSE true END isLike, (6371*acos(cos(radians(?))*cos(radians(P.lat))*cos(radians(P.lng)-radians(?)) +sin(radians(?))*sin(radians(P.lat)))) distance FROM `Post` P LEFT OUTER JOIN `JoinPost` JP ON P.`postId` = JP.`Post_postId` and JP.`isPick`=1 LEFT OUTER JOIN `User` U ON JP.User_userId = U.userId LEFT OUTER JOIN `Like` L ON L.`Post_postId` = P.`postId` and L.`User_userId`=? WHERE (`address` like ? OR (6371*acos(cos(radians(?))*cos(radians(P.lat))*cos(radians(P.lng)-radians(?)) +sin(radians(?))*sin(radians(P.lat)))) < ? ) AND isDone = 0 GROUP BY P.postId, P.User_userId, P.title, P.content, P.writer, P.price, P.headCount, P.category, P.isDone, P.image, P.lat, P.lng, P.address, P.createdAt, P.endTime ORDER BY P.createdAt DESC";

        const params = [
            lat,
            lng,
            lat,
            userId,
            findAddr + '%',
            lat,
            lng,
            lat,
            km,
        ];
        console.log(params);

        db.query(sql, params, (err, data) => {
            if (err) console.log(err);

            console.log(data, '>>>>>>>>>>>>>>>>>>>>>>>>>>>');

            for (list of data) {
                let head = list.headList;
                let newList = [];

                if (isNaN(Number(head))) {
                    head.split(',').map(id => newList.push(Number(id)));
                    list.headList = newList;
                } else if (head === null) {
                    list.headList = newList;
                } else if (head !== null) {
                    newList.push(Number(head));
                    list.headList = newList;
                }
            }

            console.log(data);
            res.send({ msg: 'success', data });
        });
    } else {
        const sql =
            "SELECT P.postId, P.User_userId, P.title, P.content, P.writer, P.price, P.headCount, P.category, P.isDone, P.image, P.lat, P.lng, P.address, P.createdAt, P.endTime, GROUP_CONCAT( DISTINCT U.userId SEPARATOR ',') headList,(6371*acos(cos(radians(?))*cos(radians(P.lat))*cos(radians(P.lng)-radians(?)) +sin(radians(?))*sin(radians(P.lat)))) distance FROM `Post` P LEFT OUTER JOIN `JoinPost` JP ON P.postId = JP.Post_postId and isPick=1 LEFT OUTER JOIN `User` U ON JP.User_userId = U.userId WHERE (`address` like ? OR (6371*acos(cos(radians(?))*cos(radians(P.lat))*cos(radians(P.lng)-radians(?)) +sin(radians(?))*sin(radians(P.lat)))) < ? ) AND isDone = 0 GROUP BY P.postId, P.User_userId, P.title, P.content, P.writer, P.price, P.headCount, P.category, P.isDone, P.image, P.lat, P.lng, P.address, P.createdAt, P.endTime ORDER BY P.createdAt DESC";

        const params = [lat, lng, lat, findAddr + '%', lat, lng, lat, km];

        db.query(sql, params, (err, data) => {
            if (err) console.log(err);

            for (list of data) {
                let head = list.headList;
                let newList = [];

                if (isNaN(Number(head))) {
                    head.split(',').map(id => newList.push(Number(id)));
                    list.headList = newList;
                } else if (head === null) {
                    list.headList = newList;
                } else if (head !== null) {
                    newList.push(Number(head));
                    list.headList = newList;
                }
            }

            res.send({ msg: 'success', data });
        });
    }
});

module.exports = router;
