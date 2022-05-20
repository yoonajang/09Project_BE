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

                const userEmail = profile._json.kakao_account.email;
                const userName = profile._json.properties.nickname
                const provider = "kakao"
                const kakaoId = profile._json.id
                const point = 50

                let params = [userEmail, userName, provider, kakaoId, point]

                let userImage = profile._json.properties.thumbnail_image
                const defaultKakaoImage = 'http://k.kakaocdn.net/dn/dpk9l1/btqmGhA2lKL/Oz0wDuJn1YV2DIn92f6DVK/img_110x110.jpg'
                const defaultImage = 'https://t1.daumcdn.net/cfile/tistory/263B293C566DA66B27'
                
                if (userImage === defaultKakaoImage){
                    userImage = defaultImage
                    params.push(userImage)
                } else {
                    params.push(userImage)
                }
            

                const sql = 'select * from User where userEmail = ? AND provider="kakao"'

                db.query(sql, userEmail, (err, results) => {
                    if (err) {
                        console.log(err);
                        done(err);
                    }

                    console.log(results, '유저가 있는지는 확인해야지.')

                    // done(null,results[0]);
                    if (results.length === 0) {
                        // 해당 유저가 존재하지 않는다면, 새로운 아이디를 만들어주고 로그인 시켜줌.

                        const sql =
                            'INSERT User(userEmail, userName, provider, kakaoId, point, userImage) values(?,?,?,?,?,?)';

                        db.query(sql, params, (err, results) => {
                            if (err) {
                                console.log(err);
                                done(err);
                            }

                            const sql =
                                'SELECT * FROM User Where userEmail = ?'; //가입이 완료되었으면 로그인

                            db.query(sql, userEmail, (err, results) => {
                                if (err) {
                                    console.log(err);
                                    done(err);
                                }
                                
                                const user = results[0];
                                console.log(user, 1, results[0])
                                return done(null, user);
                            });
                        });
                    } else {
                        //이미 유저가 존재한다면 바로 로그인
                        const user = results[0];
                        console.log(user, 2, results[0])
                        return done(null, user);
                    }
                });
            },
        ),
    );
};

