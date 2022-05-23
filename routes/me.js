const express = require('express');
const router = express.Router();
const db = require('../config');
const authMiddleware = require('../middlewares/auth');
const path = require('path');
let appDir = path.dirname(require.main.filename);
const upload = require('../S3/s3');


// 유저 프로필 수정
router.post('/me', upload.single('userImage'), authMiddleware, async (req, res) => {
    const userId = res.locals.user.userId;
    const userImage = req.file.transforms[1].location;
    const reUserImage = req.file.transforms[0].location;

    console.log(req.file.profiles[0].location;)

    console.log(userId, userImage, reUserImage, '유저 이미지를 바꾸었어요 ')
 
    try {
        const sql = 'UPDATE User SET userImage=?, reUserImage=? WHERE userId=?';
        db.query(sql, [userImage, reUserImage, userId], (err, rows) => {
            res.send({ msg: '글 등록 성공', userImage: reUserImage });
        });
    } catch (error) {
        res.status(400).send({ msg: '프로필이 수정되지 않았습니다.' });
    }
},
);


//유저 마이페이지
router.get('/:userId', authMiddleware, (req, res) => {
    const userId = req.params.userId;

    // 유저 정보
    const userinfo =
        'SELECT U.userId, U.userEmail, U.userName, U.reUserImage userImage, U.tradeCount FROM `User` U WHERE `userId`=?';
    db.query(userinfo, userId, (err, userInfo) => {
        if (err) console.log(err);

    // 유저가 작성한 리스트
    const mylist =
        "SELECT P.postId, P.User_userId userId, P.title, P.content, P.writer, P.price, P.headCount, P.category, P.isDone, P.image, P.address, P.endTime, GROUP_CONCAT(DISTINCT U.userId SEPARATOR ',') headList FROM `Post` P LEFT OUTER JOIN `JoinPost` JP ON P.postId = JP.Post_postId and isPick=1 LEFT OUTER JOIN `User` U ON JP.User_userId = U.userId WHERE P.User_userId = ? GROUP BY P.postId, P.User_userId, P.title, P.content, P.writer, P.price, P.headCount, P.category, P.isDone, P.image, P.address, P.endTime ORDER BY P.endTime DESC";

    db.query(mylist, userId, (err, myList) => {
        if (err) console.log(err);
        for (my of myList) {
            let mine = my.headList;
            let mynewList = [];

            if (isNaN(Number(mine))) {
                mine.split(',').map(id => mynewList.push(Number(id)));
                my.headList = mynewList;
            } else if (mine === null) {
                my.headList = mynewList;
            } else if (mine !== null){
                mynewList.push(Number(mine))
                my.headList = mynewList;
            }
        }

    // 유저의 참여한 리스트
    const joinlist =
        "SELECT P.postId, P.User_userId userId, P.title, P.content, P.writer, P.price, P.headCount, P.category, P.isDone, P.image, P.address, P.endTime, GROUP_CONCAT(DISTINCT U.userId SEPARATOR ',') headList FROM `Post` P LEFT OUTER JOIN `JoinPost` JP ON P.postId = JP.Post_postId and isPick=1 LEFT OUTER JOIN `User` U ON JP.User_userId = U.userId WHERE P.User_userId != ? AND JP.User_userId = ? GROUP BY P.postId, P.User_userId, P.title, P.content, P.writer, P.price, P.headCount, P.category, P.isDone, P.image, P.address, P.endTime ORDER BY P.endTime DESC";

    db.query(joinlist, [userId, userId], (err, joinList) => {
        if (err) console.log(err);
        for (join of joinList) {
            let joined = join.headList;
            let joinnewList = [];

            if (isNaN(Number(joined))) {
                joined.split(',').map(id => joinnewList.push(Number(id)));
                join.headList = joinnewList;
            } else if (joined === null) {
                join.headList = joinnewList;
            } else if (joined !== null){
                joinnewList.push(Number(joined))
                join.headList = joinnewList;
            }

        }

    // 유저의 좋아요 리스트
    const likelist =
        "SELECT P.postId, P.User_userId userId, P.title, P.content, P.writer, P.price, P.headCount, P.category, P.isDone, P.image, P.address, P.endTime, GROUP_CONCAT(DISTINCT U.userId SEPARATOR ',') headList FROM `Post` P LEFT OUTER JOIN `JoinPost` JP ON P.postId = JP.Post_postId and isPick=1 LEFT OUTER JOIN `User` U ON JP.User_userId = U.userId  LEFT OUTER JOIN `Like` L ON P.postId = L.Post_postId WHERE L.User_userId = ? GROUP BY P.postId, P.User_userId, P.title, P.content, P.writer, P.price, P.headCount, P.category, P.isDone, P.image, P.address, P.endTime ORDER BY P.endTime DESC";

    db.query(likelist, userId, (err, likeList) => {
        if (err) console.log(err);
        for (like of likeList) {
            let liked = like.headList;
            let likenewList = [];

            if (isNaN(Number(liked))) {
                liked.split(',').map(id => likenewList.push(Number(id)));
                like.headList = likenewList;
            } else if (liked === null) {
                like.headList = likenewList;
            } else if (liked !== null){
                likenewList.push(Number(liked))
                like.headList = likenewList;
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
