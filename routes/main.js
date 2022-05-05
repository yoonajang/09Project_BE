const express = require('express');
const router = express.Router();
const db = require('../config');
const moment = require('moment');
require('moment-timezone');
moment.tz.setDefault('Asia/seoul');

const authMiddleware = require('../middlewares/auth');

const upload = require('../S3/s3');

// 메인페이지 게시글 상세보기
router.get('/postdetail', (req, res) => {
    const postId = req.body.postId;
    const sql = 'select * from Post where postId=?';

    db.query(sql, postId, (err, data) => {
        if (err) console.log(err);
        res.status(201).send({ msg: 'success', data });
    });
});

// 좋아요 생성 
router.post('/like/:postId', authMiddleware, (req, res) => {
    const user = res.locals;
    const postId = req.params;
    const sql = 'INSERT INTO `Like` (`Post_postId`,`User_userId`) VALUES (?,?)'

    db.query(sql, [Number(postId.postId.toString()), user.user.userId], (err, data) => {
        if(err) console.log(err)
        res.status(201).send({msg:'success'});       
    });
});

// 좋아요 삭제
router.delete('/like/:postId', authMiddleware, (req, res) => {
    const user = res.locals;
    const postId = req.params;
    const sql = 'DELETE FROM `Like` WHERE `Post_postId`=? and `User_userId`=?'

    // console.log(user.user.userId, Number(postId.postId))
    db.query(sql, [Number(postId.postId), user.user.userId], (err, data) => {
        if(err) console.log(err)
        res.status(201).send({msg:'success'});       
    });
})

module.exports = router;
