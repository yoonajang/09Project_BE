const express = require('express');
const router = express.Router();
const db = require('../config');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middlewares/auth');
const nodemailer = require('nodemailer');
const ejs = require('ejs');
const path = require('path');
let appDir = path.dirname(require.main.filename);
const upload = require('../S3/s3');
const { PollyCustomizations } = require('aws-sdk/lib/services/polly');

const bcrypt = require('bcrypt');
const saltRounds = 10;

// 회원가입
router.post('/signup', (req, res, next) => {
    const userImage = 'https://t1.daumcdn.net/cfile/tistory/263B293C566DA66B27';
    const { userEmail, userName, userPassword } = req.body;
    const param = [userEmail, userName, userPassword, userImage];

    db.query(
        'SELECT * FROM AuthNum WHERE userEmail=?',
        userEmail,
        (err, data) => {
            if (data.length) {
                bcrypt.hash(param[2], saltRounds, (err, hash) => {
                    param[2] = hash;
                    db.query(
                        'INSERT INTO `User`(`userEmail`, `userName`, `password`, `userImage`) VALUES (?,?,?,?)',
                        param,
                        (err, row) => {
                            if (err) {
                                console.log(err);
                                res.send({ meg: 'fail' });
                            } else {
                                res.send({ meg: 'success' });
                            }
                        },
                    );
                });
            } else {
                res.send({ meg: 'fail' });
            }
        },
    );
});

//회원가입시 이메일 인증
router.post('/mail', async (req, res) => {
    const userEmail = req.body.userEmail;
    let authNum = Math.random().toString().substr(2, 6);
    let emailTemplete;

    ejs.renderFile(
        appDir + '/template/authMail.ejs',
        { authCode: authNum },
        function (err, data) {
            if (err) {
                console.log(err);
            }
            emailTemplete = data;
        },
    );

    let transporter = nodemailer.createTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
            user: process.env.nodemailerUser,
            pass: process.env.nodemailerPw,
        },
    });

    //메일 제목 설정
    let mailOptions = await transporter.sendMail({
        from: process.env.nodemailerUser,
        to: userEmail,
        subject: '[Nbbang] 회원가입을 위한 인증번호를 입력해주세요.',
        html: emailTemplete,
    });

    //authNum 저장
    db.query(
        'SELECT * FROM AuthNum WHERE userEmail=?',
        userEmail,
        (err, data) => {
            // if(err) console.log(err)
            console.log(data.length === 0);
            if (data.length === 0) {
                db.query(
                    'INSERT AuthNum(`authNum`, `userEmail`) VALUES (?,?)',
                    [authNum, userEmail],
                    (err, data) => {
                        res.send({ msg: 'success' });
                    },
                );
            } else {
                db.query(
                    'UPDATE AuthNum SET authNum=? WHERE userEmail=?',
                    [authNum, userEmail],
                    (err, data) => {
                        res.send({ msg: 'success' });
                    },
                );
            }
        },
    );
});

//이메일 인증 확인
router.post('/mailauth', async (req, res) => {
    const { userEmail, authNum } = req.body;

    db.query(
        'SELECT * FROM AuthNum WHERE userEmail=?',
        userEmail,
        (err, data) => {
            if (data[0].authNum === authNum) {
                res.send({ msg: 'success' });
            } else {
                res.send({ msg: 'fail' });
            }
        },
    );
});

// 이메일 중복확인
router.post('/emailcheck', (req, res) => {
    const email = req.body.userEmail;
    const sql = 'select * from User where userEmail=?';

    db.query(sql, [email], (err, data) => {
        if (data.length === 0) {
            console.log(err);
            res.send({ msg: 'success' });
        } else {
            res.send({ msg: 'fail' });
        }
    });
});

// 닉네임 중복확인
router.post('/namecheck', (req, res) => {
    const name = req.body.userName;
    const sql = 'select * from User where userName=?';

    db.query(sql, [name], (err, data) => {
        if (data.length === 0) {
            console.log(err);
            res.send({ msg: 'success' });
        } else {
            res.send({ msg: 'fail' });
        }
    });
});

// 로그인
router.post('/login', (req, res) => {
    const param = [req.body.userEmail, req.body.userPassword];
    const sql = 'SELECT * FROM User WHERE userEmail=?';

    console.log(param);

    db.query(sql, param[0], (err, data) => {
        if (err) console.log(err);

        if (data.length > 0) {
            bcrypt.compare(param[1], data[0].password, (err, result) => {
                if (result) {
                    const userInfo = {
                        userId: data[0].userId,
                        userEmail: data[0].userEmail,
                        userName: data[0].userName,
                        userImage: data[0].userImage,
                        tradeCount: data[0].tradeCount,
                    };
                    const token = jwt.sign(
                        { userId: data[0].userId },
                        process.env.JWT_SECRET,
                    );
                    res.send({ msg: 'success', token, userInfo });
                } else {
                    console.log('비밀번호 틀림');
                    res.send({ msg: 'fail' });
                }
            });
        } else {
            console.log('아이디 없음');
            res.send({ msg: 'fail' });
        }
    });
});

// 로그인 여부확인
router.get('/islogin', authMiddleware, async (req, res) => {
    const { user } = res.locals;
    console.log(user.userId);
    res.send({
        userInfo: {
            userId: user.userId,
            userEmail: user.userEmail,
            userName: user.userName,
            userImage: user.userImage,
            tradeCount: user.tradeCount,
        },
    });
});

// 유저 프로필 수정
router.post('/me', upload.single('userImage'), authMiddleware, async (req, res) => {
        const userId = res.locals.user.userId;
        const userImage = req.file?.location;
        // console.log(userId, userImage);
        try {
            const sql = ' UPDATE User SET userImage=? WHERE userId=?';
            db.query(sql, [userImage, userId], (err, rows) => {
                res.send({ msg: '글 등록 성공' });
            });
        } catch (error) {
            res.status(400).send({ msg: '프로필이 수정되지 않았습니다.' });
        }
    },
);


//유저 마이페이지 (참여한 게시판 조회) *** 자신의 것 조회할때랑 다른사람것 조회할때를... 프론트와 의논.
router.get('/:userId', authMiddleware, (req, res) => {
    const userId = req.params.userId;

    // 유저 정보
    const userinfo = 
        "SELECT U.userId, U.userEmail, U.userName, U.userImage, U.tradeCount FROM `User` U WHERE `userId`=?";
    db.query(userinfo, userId,(err, userInfo) =>{
        if (err) console.log(err)
    

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
                head.split(',').map(id => newList.push(Number(id)))
                list.headList = newList;
            } else {
                newList.push(list.userId);
                list.headList = newList;
            }
            
        }

        
    // 유저의 참여한 리스트
    const joinlist =
        "SELECT P.postId, P.User_userId userId, P.title, P.content, P.writer, P.price, P.headCount, P.category, P.isDone, P.image, P.address, P.endTime, GROUP_CONCAT(DISTINCT U.userId SEPARATOR ',') headList FROM `Post` P LEFT OUTER JOIN `JoinPost` JP ON P.postId = JP.Post_postId and isPick=1 LEFT OUTER JOIN `User` U ON JP.User_userId = U.userId WHERE P.User_userId = 6 OR JP.User_userId = ? GROUP BY P.postId, P.User_userId, P.title, P.content, P.writer, P.price, P.headCount, P.category, P.isDone, P.image, P.address, P.endTime ORDER BY P.endTime DESC";

    db.query(joinlist, [userId], (err, joinList) => {
        if (err) console.log(err);
        for (list of joinList) {
            let head = list.headList;
            let newList = [];

            if (list.headList !== null) {
                newList.push(list.userId);
                head.split(',').map(id => newList.push(Number(id)))
                list.headList = newList;
            } else {
                newList.push(list.userId);
                list.headList = newList;
            }
                
        }


    // 유저의 좋아요 리스트
    const likelist = 
        "SELECT P.postId, P.User_userId userId, P.title, P.content, P.writer, P.price, P.headCount, P.category, P.isDone, P.image, P.address, P.endTime, GROUP_CONCAT(DISTINCT U.userId SEPARATOR ',') headList FROM `Post` P LEFT OUTER JOIN `JoinPost` JP ON P.postId = JP.Post_postId and isPick=1 LEFT OUTER JOIN `User` U ON JP.User_userId = U.userId  LEFT OUTER JOIN `Like` L ON P.postId = L.Post_postId WHERE L.User_userId = ? GROUP BY P.postId, P.User_userId, P.title, P.content, P.writer, P.price, P.headCount, P.category, P.isDone, P.image, P.address, P.endTime ORDER BY P.endTime DESC"

    db.query(likelist, userId, (err, likeList) => {
        if (err) console.log(err);
        for (list of likeList) {
            let head = list.headList;
            let newList = [];

            if (list.headList !== null) {
                newList.push(list.userId);
                head.split(',').map(id => newList.push(Number(id)))
                list.headList = newList;
            } else {
                newList.push(list.userId);
                list.headList = newList;
            }
                
        }
    
        
        res.status(201).send({ msg: 'success', userInfo, myList, joinList, likeList});
    })  
    })
    })
    })
});


module.exports = router; 