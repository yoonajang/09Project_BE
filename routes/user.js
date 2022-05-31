const express = require('express');
const router = express.Router();
const db = require('../config');
const mysql = require('mysql');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middlewares/auth');
const nodemailer = require('nodemailer');
const ejs = require('ejs');
const path = require('path');
let appDir = path.dirname(require.main.filename);
const upload = require('../S3/s3');
const { PollyCustomizations } = require('aws-sdk/lib/services/polly');
const passport = require('passport');
const bcrypt = require('bcrypt');
const saltRounds = 10;


// 회원가입
router.post('/signup', (req, res, next) => {
    
    const Index =  Math.floor(Math.random()*4)
    const profileImages = ['1653383370230','1653383345720','1653383406785','1653381889650']
    const baseURL = 'https://nbbang-resizing.s3.ap-northeast-2.amazonaws.com/w_200/'

    const userImage = baseURL + profileImages[Index] +'_resized.png'
    const reUserImage = baseURL + profileImages[Index] +'_origin.png'

    const { userEmail, userName, userPassword } = req.body;
    const param = [userEmail, userName, userPassword, userImage, reUserImage, 50, 0, 1];

    if (userName.length < 2 || userName.length > 8 || userPassword.length < 6 || userPassword.length > 20) {
        res.status(201).send({ msg : '닉네임과 비밀번호 글자수를 확인하세요' })
    } else {
        db.query(
            'SELECT * FROM AuthNum WHERE userEmail=?',
            userEmail,
            (err, data) => {
                if (data.length) {
                    bcrypt.hash(param[2], saltRounds, (err, hash) => {
                        param[2] = hash;
                        db.query(
                            'INSERT INTO `User`(`userEmail`, `userName`, `password`, `userImage`,`reUserImage`, `point`, `tradeCount`,`isActive`) VALUES (?,?,?,?,?,?,?,?)',
    
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
    }
});

//회원가입시 이메일 인증코드 보내기
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

    // authNum 저장
    db.query(
        'SELECT *, TIMESTAMPDIFF(minute, updatedAt, now()) timeDiff FROM AuthNum WHERE userEmail=?',
        userEmail,
        (err, data) => { 
            // const authNum = user[0].authNum

            if (data.length === 0 ) {
                db.query(
                    'INSERT AuthNum(`authNum`, `userEmail`,`count`) VALUES (?,?,?)',
                    [authNum, userEmail, 1],
                    (err, data) => {
                        res.send({ msg: 'success' });
                    },
                );
            } else if ( data[0].timeDiff > 5) {
                db.query(
                    'UPDATE AuthNum SET authNum=?, `updatedAt`=now(), `count`=1 WHERE userEmail=?',
                    [authNum, userEmail],
                    (err, data) => {
                        res.send({ msg: 'success' });
                    },
                );

            } else if (data[0].count < 3 && data[0].timeDiff <= 5) {
                db.query(
                    'UPDATE AuthNum SET authNum=?, `count`=count+1 WHERE userEmail=?',
                    [authNum, userEmail],
                    (err, data) => {
                        res.send({ msg: 'success' });
                    },
                );
            } else if (data[0].count === 3 && data[0].timeDiff <= 5) {
                res.send({ msg: 'fail' });
            }   
    });
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

    db.query(sql, param[0], (err, data) => {
        if (err) console.log(err);

        if (data.length > 0) {
   
            bcrypt.compare(param[1], data[0].password, (err, result) => {
            if (result) {

                const userId = data[0].userId

                // 알림
                // SendMessage (게시물당 1개씩 알림보내기)
                const sql_1 = 
                    'SELECT A.alarmId, A.status, A.createdAt, A.Post_postId, A.type, P.title, P.reImage image FROM Alarm A Join Post P ON P.postId = A.Post_postId WHERE A.User_userId=? AND A.type="sendMessage" AND A.isChecked = 0 GROUP BY A.type, A.Post_postId;';
                const sql_1s = mysql.format(sql_1, userId);

                // leaveChat (모든 알림 다보내기)
                const sql_2 = 
                    'SELECT A.alarmId, A.status, A.createdAt, A.Post_postId, A.type, P.title, P.reImage image FROM Alarm A Join Post P ON P.postId = A.Post_postId WHERE A.User_userId=? AND A.type="leaveChat" AND A.isChecked = 0 ;';
                const sql_2s = mysql.format(sql_2, userId);

                // blockChat (모든 알림 다보내기)
                const sql_3 = 
                    'SELECT A.alarmId, A.status, A.createdAt, A.Post_postId, A.type, P.title, P.reImage image FROM Alarm A Join Post P ON P.postId = A.Post_postId WHERE A.User_userId=? AND A.type="blockChat" AND A.isChecked = 0 ;';
                const sql_3s = mysql.format(sql_3, userId);

                // addDeal (모든 알림 다보내기)
                const sql_4 = 
                    'SELECT A.alarmId, A.status, A.createdAt, A.Post_postId, A.type, P.title, P.reImage image FROM Alarm A Join Post P ON P.postId = A.Post_postId WHERE A.User_userId=? AND A.type="addDeal" AND A.isChecked = 0 ;';
                const sql_4s = mysql.format(sql_4, userId);

                // byebye (모든 알림 다보내기)
                const sql_5 = 
                    'SELECT A.alarmId, A.status, A.createdAt, A.Post_postId, A.type, P.title, P.reImage image FROM Alarm A Join Post P ON P.postId = A.Post_postId WHERE A.User_userId=? AND A.type="byebye" AND A.isChecked = 0 ;';
                const sql_5s = mysql.format(sql_5, userId);

                // review (모든 알림 다보내기)
                const sql_6 = 
                    'SELECT A.alarmId, A.status, A.createdAt, A.Post_postId, A.type, P.title, P.reImage image FROM Alarm A Join Post P ON P.postId = A.Post_postId WHERE A.User_userId=? AND A.type="review" AND A.isChecked = 0 ;';
                const sql_6s = mysql.format(sql_6, userId);

                db.query(sql_1s + sql_2s + sql_3s + sql_4s + sql_5s + sql_6s, (err, rows) => {
                    if (err) {
                        console.log(err);
                    } else {
                        const sendMessage = rows[0];
                        const leaveChat = rows[1];
                        const blockChat = rows[2];
                        const addDeal = rows[3];
                        const byebye = rows[4];
                        const review = rows[5];

                        const userInfo = {
                            userId: data[0].userId,
                            userEmail: data[0].userEmail,
                            userName: data[0].userName,
                            userImage: data[0].userImage,
                            tradeCount: data[0].tradeCount,
                        };
                        
                        const alarm = { sendMessage: sendMessage, 
                                        leaveChat: leaveChat,
                                        blockChat: blockChat,
                                        addDeal: addDeal,
                                        byebye: byebye,
                                        review: review }


                        const token = jwt.sign(
                            { userId: data[0].userId },
                            process.env.JWT_SECRET,
                        );

                        res.send({ msg: 'success', token, userInfo, alarm});   
            
                    }
                });
                
            } else {
                res.send({ msg: 'fail' });
            }
        });
        
        } else {
            res.send({ msg: 'fail' });
        }
    });
});



// 로그인 여부확인
router.get('/islogin', authMiddleware, (req, res) => {
    const { user } = res.locals
    const userId = res.locals.user.userId;


    // SendMessage (게시물당 1개씩 알림보내기)
    const sql_1 = 
        'SELECT A.alarmId, A.status, A.createdAt, A.Post_postId, A.type, P.title, P.reImage image FROM Alarm A Join Post P ON P.postId = A.Post_postId WHERE A.User_userId=? AND A.type="sendMessage" AND A.isChecked = 0 GROUP BY A.type, A.Post_postId;';
    const sql_1s = mysql.format(sql_1, userId);

    // leaveChat (모든 알림 다보내기)
    const sql_2 = 
        'SELECT A.alarmId, A.status, A.createdAt, A.Post_postId, A.type, P.title, P.reImage image FROM Alarm A Join Post P ON P.postId = A.Post_postId WHERE A.User_userId=? AND A.type="leaveChat" AND A.isChecked = 0 ;';
    const sql_2s = mysql.format(sql_2, userId);

    // blockChat (모든 알림 다보내기)
    const sql_3 = 
        'SELECT A.alarmId, A.status, A.createdAt, A.Post_postId, A.type, P.title, P.reImage image FROM Alarm A Join Post P ON P.postId = A.Post_postId WHERE A.User_userId=? AND A.type="blockChat" AND A.isChecked = 0 ;';
    const sql_3s = mysql.format(sql_3, userId);

    // addDeal (모든 알림 다보내기)
    const sql_4 = 
        'SELECT A.alarmId, A.status, A.createdAt, A.Post_postId, A.type, P.title, P.reImage image FROM Alarm A Join Post P ON P.postId = A.Post_postId WHERE A.User_userId=? AND A.type="addDeal" AND A.isChecked = 0 ;';
    const sql_4s = mysql.format(sql_4, userId);

    // byebye (모든 알림 다보내기)
    const sql_5 = 
        'SELECT A.alarmId, A.status, A.createdAt, A.Post_postId, A.type, P.title, P.reImage image FROM Alarm A Join Post P ON P.postId = A.Post_postId WHERE A.User_userId=? AND A.type="byebye" AND A.isChecked = 0 ;';
    const sql_5s = mysql.format(sql_5, userId);
    
    // review (모든 알림 다보내기)
    const sql_6 = 
        'SELECT A.alarmId, A.status, A.createdAt, A.Post_postId, A.type, P.title, P.reImage image FROM Alarm A Join Post P ON P.postId = A.Post_postId WHERE A.User_userId=? AND A.type="review" AND A.isChecked = 0 ;';
    const sql_6s = mysql.format(sql_6, userId);

    db.query(sql_1s + sql_2s + sql_3s + sql_4s + sql_5s + sql_6s, (err, rows) => {
        if (err) {
            console.log(err);
        } else {
            const sendMessage = rows[0];
            const leaveChat = rows[1];
            const blockChat = rows[2];
            const addDeal = rows[3];
            const byebye = rows[4];
            const review = rows[5];
            
            const alarm = { sendMessage: sendMessage, 
                            leaveChat: leaveChat,
                            blockChat: blockChat,
                            addDeal: addDeal,
                            byebye: byebye,
                            review: review }
            
            res.send({
                userInfo: {
                    userId: user.userId,
                    userEmail: user.userEmail,
                    userName: user.userName,
                    userImage: user.userImage,
                    tradeCount: user.tradeCount,
                },
                alarm: alarm            
            });

        }
    });
});

//알람확인
router.patch('/ischecked', authMiddleware, (req, res) => {    
    const userId = res.locals.user.userId;
    const sql =
        'SELECT * FROM Alarm WHERE User_userId = ? and isChecked = 0';

    db.query(sql, userId, (err, rows) => {
        if (rows.length !== 0) {
            const updateSql =
                'UPDATE Alarm SET isChecked = 1 WHERE User_userId=?';

            db.query(updateSql, userId, (err, data) => {
                if (err) console.log(err);
                    res.send({ msg: 'success'});
            });
        } else {
            res.send({ msg: 'empty' });
        }
    });
});

//회원탈퇴
router.delete('/:userId', authMiddleware, (req, res) => {    
    const userId = res.locals.user.userId;
    const sql =
        'UPDATE User SET userEmail = "Deleted Email", userName = "Deleted Name", userImage = "https://nbbang-resizing.s3.ap-northeast-2.amazonaws.com/w_200/1653383406785_resized.png", reUserImage = "https://nbbang-resizing.s3.ap-northeast-2.amazonaws.com/w_200/1653383406785_resized.png", tradeCount = 0, provider = 0, kakaoId = 0, isActive = 0 WHERE userId = ?';

    db.query(sql, userId, (err, rows) => {
        if (err) console.log(err);
        res.send({ msg: 'success'});
    });
});

module.exports = router;
