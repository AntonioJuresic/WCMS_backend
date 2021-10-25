const jwt = require("jsonwebtoken");
const config = require("../config");

module.exports = function () {
    return function (req, res, next) {
        const token = req.body.token || req.params.token || req.headers["x-access-token"] || req.query.token;

        jwt.verify(token, config.secret, function (err, decoded) {
            if (decoded.authorityLevel == 0 || decoded.authorityLevel == null) {
                return res.status(403).send({
                    status: 403,
                    message: "You don't have the right authority"
                });
            } else {
                req.decoded = decoded;
                next();
            }
        });
    }
}