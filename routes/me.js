const express = require('express');
const router = express.Router();
const db = require('../config');
const authMiddleware = require('../middlewares/auth');
const path = require('path');
let appDir = path.dirname(require.main.filename);
const upload = require('../S3/s3');
const { PollyCustomizations } = require('aws-sdk/lib/services/polly');

// 유저 프로필 수정
router.post('/me',upload.single('userImage'), authMiddleware, async (req, res) => {
        const userId = res.locals.user.userId;
        const userImage = req.file?.location;
        // console.log(userId, userImage);
        try {
            const sql = ' UPDATE User SET userImage=? WHERE userId=?';
            db.query(sql, [userImage, userId], (err, rows) => {
                res.send({ msg: '글 등록 성공', userImage });
            });
        } catch (error) {
            res.status(400).send({ msg: '프로필이 수정되지 않았습니다.' });
        }
    },
);

//유저 마이페이지 (참여한 게시판 조회) *** 자신의 것 조회할때랑 다른사람것 조회할때를... 프론트와 의논.
router.get('/:userId', authMiddleware, (req, res) => {
    console.log('아니 왜 읽지를 못하니?')
    const userId = req.params.userId;

    // 유저 정보
    const userinfo =
        'SELECT U.userId, U.userEmail, U.userName, U.userImage, U.tradeCount FROM `User` U WHERE `userId`=?';
    db.query(userinfo, userId, (err, userInfo) => {
        if (err) console.log(err);

    // 유저가 작성한 리스트
    const mylist =
        "SELECT P.postId, P.User_userId userId, P.title, P.content, P.writer, P.price, P.headCount, P.category, P.isDone, P.image, P.address, P.endTime, GROUP_CONCAT(DISTINCT U.userId SEPARATOR ',') headList FROM `Post` P LEFT OUTER JOIN `JoinPost` JP ON P.postId = JP.Post_postId and isPick=1 LEFT OUTER JOIN `User` U ON JP.User_userId = U.userId WHERE P.User_userId = ? GROUP BY P.postId, P.User_userId, P.title, P.content, P.writer, P.price, P.headCount, P.category, P.isDone, P.image, P.address, P.endTime ORDER BY P.endTime DESC";

    db.query(mylist, userId, (err, myList) => {
        if (err) console.log(err);
        for (list of myList) {
            let head = list.headList;
            let newList = [];

            if (list.headList !== null) {
                newList.push(list.userId);
                head.split(',').map(id => newList.push(Number(id)));
                list.headList = newList;
            } else {
                newList.push(list.userId);
                list.headList = newList;
            }
        }

    // 유저의 참여한 리스트
    const joinlist =
        "SELECT P.postId, P.User_userId userId, P.title, P.content, P.writer, P.price, P.headCount, P.category, P.isDone, P.image, P.address, P.endTime, GROUP_CONCAT(DISTINCT U.userId SEPARATOR ',') headList FROM `Post` P LEFT OUTER JOIN `JoinPost` JP ON P.postId = JP.Post_postId and isPick=1 LEFT OUTER JOIN `User` U ON JP.User_userId = U.userId WHERE P.User_userId = ? OR JP.User_userId = ? GROUP BY P.postId, P.User_userId, P.title, P.content, P.writer, P.price, P.headCount, P.category, P.isDone, P.image, P.address, P.endTime ORDER BY P.endTime DESC";

    db.query(joinlist, [userId, userId], (err, joinList) => {
        console.log(joinList)
        if (err) console.log(err);
        for (list of joinList) {
            let head = list.headList;
            let newList = [];

            if (list.headList !== null) {
                newList.push(list.userId);
                head.split(',').map(id => newList.push(Number(id)));
                list.headList = newList;
            } else {
                newList.push(list.userId);
                list.headList = newList;
            }
        }
    console.log(joinList)

    // 유저의 좋아요 리스트
    const likelist =
        "SELECT P.postId, P.User_userId userId, P.title, P.content, P.writer, P.price, P.headCount, P.category, P.isDone, P.image, P.address, P.endTime, GROUP_CONCAT(DISTINCT U.userId SEPARATOR ',') headList FROM `Post` P LEFT OUTER JOIN `JoinPost` JP ON P.postId = JP.Post_postId and isPick=1 LEFT OUTER JOIN `User` U ON JP.User_userId = U.userId  LEFT OUTER JOIN `Like` L ON P.postId = L.Post_postId WHERE L.User_userId = ? GROUP BY P.postId, P.User_userId, P.title, P.content, P.writer, P.price, P.headCount, P.category, P.isDone, P.image, P.address, P.endTime ORDER BY P.endTime DESC";

    db.query(likelist, userId, (err, likeList) => {
        if (err) console.log(err);
        for (list of likeList) {
            let head = list.headList;
            let newList = [];

            if (list.headList !== null) {
                newList.push(list.userId);
                head.split(',').map(id => newList.push(Number(id)));
                list.headList = newList;
            } else {
                newList.push(list.userId);
                list.headList = newList;
            }
        }

        res.status(201).send({
            msg: 'success',
            userInfo,
            myList,
            joinList,
            likeList,
        });
    });
    });
    });
    });
});

module.exports = router;
