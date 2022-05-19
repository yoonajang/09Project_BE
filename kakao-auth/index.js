require('dotenv').config();
const passport = require('passport');
const db = require('../config');
// const { connect } = require('../config');
const KakaoStrategy = require('passport-kakao').Strategy;
// const User = require('../schemas/user.schemas');

console.log(process.env.KAKAO_CLIENT_ID)
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
                
                const sql = 'select * from User where userId = ? AND provider ="kakao"';
                const post = [NewUserEmail];

                db.query(sql, profile.id, (err, results, fields) => {
                    if (err) {
                        console.log(err);
                        done(err);
                    }
                    if (results.length === 0) {
                        // 해당 유저가 존재하지 않는다면, 새로운 아이디를 만들어주고 로그인 시켜줌.
                        const sql =
                            'INSERT User(userEmail, password) values(?,?)';
                        const post = [NewUserEmail, NewUserPassword];
                        db.query(sql, post, (err, results, fields) => {
                            if (err) {
                                console.log(err);
                                done(err);
                            }
                            const sql =
                                ' SELEVT * FROM User Where userEmail =?'; //가입이 완료되었으면 로그인
                            const post = [NewUserEmail];
                            db.query(sql, post, (err, results, fields) => {
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

