const tokenValidation = require("../token-validation");
const config = require("../../config");

const jwt = require("jsonwebtoken");
const crypto = require("crypto");

module.exports = function (express, connectionPool) {
    let authenticationRouter = express.Router();


    authenticationRouter.route("/")
        .post(async function (req, res) {
            try {
                let databaseConnection = await connectionPool.getConnection();

                let queryUsernameStatement =
                    "SELECT username FROM user " +
                    "WHERE username = ? " + 
                    "AND deleted = false;";

                let usernameData = await databaseConnection.query(queryUsernameStatement, req.body.username);

                if (usernameData.length == 0) {
                    return res.status(404).json({ status: 404, message: "User doesn't exists" })

                } else if (usernameData.length > 0) {
                    let compare = false;

                    let passwordFromRequest = req.body.password;
                    let hash = crypto.pbkdf2Sync(passwordFromRequest, config.salt, 1000, 64, "sha512").toString("hex");


                    let queryPasswordStatement =
                        "SELECT password FROM user " +
                        "WHERE username = ? ;";

                    let passwordFromDB = await databaseConnection.query(queryPasswordStatement, req.body.username);

                    compare = hash == passwordFromDB[0].password;

                    if (compare) {
                        let queryUserStatement =
                            "SELECT id, username, email, dateOfCreation, imagePath " +
                            "FROM user " +
                            "WHERE username = ? ;";

                        let userData = await databaseConnection.query(queryUserStatement, req.body.username);

                        console.log(userData[0]);
                        
                        const token = jwt.sign({
                            id: userData[0].id,
                            username: userData[0].username,
                            email: userData[0].email,
                            imagePath: userData[0].imagePath,
                            dateOfCreation: userData[0].dateOfCreation
                        }, config.secret, {
                            //expiresIn: 3600
                        });

                        return res.status(200).json({ status: 200, token: token, userData: userData[0] });
                    } else {
                        return res.status(403).json({ status: 403, message: "Wrong password" });
                    }

                }

            } catch (e) {
                console.log(e);
                return res.status(500).json({ error: "Server error" })
            }
        });

    authenticationRouter.use(tokenValidation());

    authenticationRouter.route("/")
        .get(async function (req, res) {
            res.status(200).json({
                status: 200
            });
        });

    return authenticationRouter;
}