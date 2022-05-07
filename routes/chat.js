const express = require('express');
const router = express.Router();
const db = require('../config');
// const moment = require('moment');
// require('moment-timezone');
// moment.tz.setDefault('Asia/seoul');

const authMiddleware = require('../middlewares/auth');


//거래 참여자 추가 (방장만 권한)  //postId가 아닌 chatId로 보내줄 예정(수정필요), 프론트에 추가된 유저정보를 보내줌
router.post('/deal/add/:userId', authMiddleware, (req, res, next) => {
    const postId = req.body.postId
    const joinId = res.paramsId;
    const user = res.locals.user.userId;  //수정원하는 자
    
    const sql = "SELECT `postId`,`User_userId` FROM `Post` WHERE `postId`=?";

    db.query(sql, postId, (err, rows) => {
        console.log('postId:', postId, "참여자:", joinId, "작업자:", user, "방장:", rows[0].User_userId)

        if (rows[0].User_userId === user) {
            const sql = "SELECT `User_userId`, `Post_postId` FROM `JoinPost` WHERE `User_userId`=? and `Post_postId`=?"

            db.query(sql, [joinId, Number(postId)], (err, join) => {
                if(join.length === 0) {
                    const sql = "INSERT INTO `JoinPost` (`User_userId`, `Post_postId`) VALUES (?,?)";
                    db.query(sql, [joinId, Number(postId)], (err, join) => {
                        res.send({ msg: 'success'}); 
                    })
                } else {
                    console.log("이미 추가됨")
                    res.send({ msg: 'fail'});
                }
            })
        } else {
            console.log("권한 없음")
            res.send({ msg: 'fail'});
        }
    });
});


//거래 참여자 삭제 //postId가 아닌 chatId로 보내줄 예정(수정필요) //프론트에 삭제된 유저정보를 보내줌
router.delete('/deal/delete/:userId', authMiddleware, (req, res, next) => {
    const postId = req.body.postId
    const joinId = res.paramsId;
    const user = res.locals.user.userId;  // 수정원하는 자

    const sql = "SELECT `postId`,`User_userId` FROM `Post` WHERE `postId`=?";

    db.query(sql, postId, (err, rows) => {
        console.log('postId:', postId, "참여자:", joinId, "작업자:", user, "방장:", rows[0].User_userId)

        if (rows[0].User_userId === user || joinId === user) {
            const sql = 'DELETE FROM `JoinPost` WHERE `User_userId`=? and `Post_postId`=?'

            db.query(sql, [joinId, Number(postId)], (err, join) => {
                res.send({ msg: 'success'}); 
            })
        } else {
            console.log("권한 없음")
            res.send({ msg: 'fail'});
        }

    });
});


module.exports = router;