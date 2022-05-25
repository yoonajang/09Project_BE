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
                console.log(profile);

                const userEmail = profile._json.kakao_account.email;
                const userName = profile._json.properties.nickname
                const provider = "kakao"
                const kakaoId = profile._json.id
                const point = 50
                const tradeCount = 0

                let params = [userEmail, userName, provider, kakaoId, point, tradeCount]

                let reUserImage = profile._json.properties.thumbnail_image
                let userImage = profile._json.properties.profile_image

                const defaultKakaoOriginImage = 'http://k.kakaocdn.net/dn/dpk9l1/btqmGhA2lKL/Oz0wDuJn1YV2DIn92f6DVK/img_640x640.jpg'
                
                // 랜덤 프로필 이미지
                const Index =  Math.floor(Math.random()*4)
                const profileImages = ['1653383370230','1653383345720','1653383406785','1653381889650']
                const baseURL = 'https://nbbang-resizing.s3.ap-northeast-2.amazonaws.com/w_200/'

                const defaultImage = baseURL + profileImages[Index] +'_resized.png'
                const defaultOriginImage = baseURL + profileImages[Index] +'_origin.png'
                
                if (userImage === defaultKakaoOriginImage){
                    reUserImage = defaultImage
                    userImage = defaultOriginImage
                    params.push(userImage)
                    params.push(reUserImage)
                } else {
                    params.push(userImage)
                    params.push(reUserImage)
                }
            
                const sql = 'select * from User where userEmail = ? AND provider="kakao"'

                db.query(sql, userEmail, (err, results) => {
                    if (err) {
                        console.log(err);
                        done(err);
                    }
                    
                    if (results.length === 0) {
                        // 해당 유저가 존재하지 않는다면, 새로운 아이디를 만들어주고 로그인 시켜줌.

                        const sql =
                            'INSERT User(userEmail, userName, provider, kakaoId, point, userImage, reUserImage) values(?,?,?,?,?,?,?)';

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

