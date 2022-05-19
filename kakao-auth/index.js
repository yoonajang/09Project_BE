require('dotenv').config();
const passport = require('passport');
const db = require('../config');
const KakaoStrategy = require('passport-kakao').Strategy;


module.exports = () => {
    passport.use(
        new KakaoStrategy(
            {
                clientID: process.env.KAKAO_CLIENT_ID,
                clientSecret: process.env.KAKAO_CLIENT_SECRET,
                callbackURL: process.env.KAKAOCALLBACKURL,
            },

            async (accessToken, refreshToken, profile, done) => {
                console.log('try in', profile,'<<<<<<<');
                
                const userEmail = profile.kakao_account.email
                const sql = 'select * from User where kakaoId = ? AND provider ="kakao"'

                db.query(sql, profile.id, (err, results) => {
                    if (err) {
                        console.log(err);
                        done(err);
                    }
                    // done(null,results[0]);
                    if (results.length === 0) {
                        // 해당 유저가 존재하지 않는다면, 새로운 아이디를 만들어주고 로그인 시켜줌.
                        const sql =
                            'INSERT User(userEmail) values(?)';

                        db.query(sql, userEmail, (err, results) => {
                            if (err) {
                                console.log(err);
                                done(err);
                            }
                            // done(null,results[0]); // 로그인 인증 완료... 일것이다.

                            const sql =
                                'SELECT * FROM User Where userEmail =?'; //가입이 완료되었으면 로그인

                            db.query(sql, userEmail, (err, results) => {
                                if (err) {
                                    console.log(err);
                                    done(err);
                                }
                                
                                const user = results[0];
                                return done(null, user);
                            });
                        });
                    } else {
                        //이미 유저가 존재한다면 바로 로그인
                        const user = results[0];
                        return done(null, user);
                    }
                });
            },
        ),
    );
};

