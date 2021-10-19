const jwt = require("jsonwebtoken");
const config = require("../config");

module.exports = function () {
    return function (req, res, next) {
        const token = req.body.token || req.params.token || req.headers["x-access-token"] || req.query.token;

        if (token) {
            jwt.verify(token, config.secret, function (err, decoded) {
                if (err) {
                    return res.status(403).send({
                        status: 403,
                        message: "Wrong token"
                    });
                } else {
                    req.decoded = decoded;
                    next();
                }
            });
        } else {
            return res.status(403).send({
                status: 403,
                message: "No token"
            });
        }
    }
}