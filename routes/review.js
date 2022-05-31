const express = require('express');
const router = express.Router();
const db = require('../config');
const mysql = require('mysql');
const authMiddleware = require('../middlewares/auth');

const moment = require('moment');
require('moment-timezone');
moment.tz.setDefault('Asia/seoul');

// domain/user


// Review 작성
router.post('/me/:postId', authMiddleware, (req, res) => {
    // writerId : 글쓴이Id, userId : 방장Id
    const writerId = res.locals.user.userId; 
    const postId = Number(req.params.postId);
    const userId = req.body.userId
    const review = req.body.review

    if (review.length > 200){
        res.send({ msg: 'fail' });
    } else {
        // Review 생성
        const sql_1 =
            'INSERT INTO `Review` (`Post_postId`,`User_userId`,`review`, `writerId`) VALUES (?,?,?,?);';
        const param_1 = [postId, userId, review, writerId]
        const sql_1s = mysql.format(sql_1, param_1 );

        // JoinPost에서 Review 상태 변경
        const sql_2 =
            'UPDATE JoinPost SET needReview = 0 WHERE Post_postId = ? AND User_userId = ?;';
        const param_2 = [postId, writerId]
        const sql_2s = mysql.format(sql_2, param_2);

        db.query(sql_1s + sql_2s, (err, results) => {
            if(err) console.log(err)
            res.send({ msg: 'success' });
        });
    }       
});



// Review 조회
router.get('/review/:userId', authMiddleware, (req, res) => {
    // writerId : 글쓴이Id, userId : 방장Id 
    const userId = Number(req.params.userId);     

    console.log(userId, req.params.userId)

    const sql =
        'SELECT R.review, R.createdAt, U.reUserImage userImage, U.userName FROM Review R INNER JOIN User U On U.userId = R.writerId WHERE User_userId = ?';
    db.query(sql, userId, (err, rows) => {
        if (err) console.log(err);
        
        const count = rows.length
        if (count === 0){
            // const createdAt = rows[0].createdAt
            // console.log(createdAt, moment(rows[0].createdAt), '1111')
            res.send({ msg: 'success', review:rows, count: 0});
        } else {
            // const createdAt = rows[0].createdAt
            // console.log(createdAt, moment(rows[0].createdAt), '1111')
            res.send({ msg: 'success', review:rows, count: count});
        }
    });
});

module.exports = router;