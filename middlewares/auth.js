const jwt = require('jsonwebtoken');
const db = require('../config');

module.exports = (req, res, next) => {
    const { authorization } = req.headers;
    const [authType, authToken] = authorization.split(' ');
    console.log(authorization);

    if (!authToken || authType !== 'Bearer') {
        res.status(401).json({
            errorMessage: '로그인 후 이용 가능한 기능입니다.1',
        });
        return;
    }

    try {
        const { userId } = jwt.verify(authToken, process.env.JWT_SECRET);           

        const sql = 'select * from User where userId=?';

        const userInfo = db.query(sql, userId, (err, data) => {
            if (err) console.log(err);

            data.map(userId => {
                res.locals.user = userId;
                next();
            });
        });
    } catch (error) {
        res.status(401).json({
            errorMessage: '로그인 후 이용 가능한 기능입니다.2',
        });
        return;
    }
};
