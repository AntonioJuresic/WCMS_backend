const tokenValidation = require("../token-validation");
const config = require("../../config");

const jwt = require("jsonwebtoken");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");

const fileStorageEngine = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, config.uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, uuidv4() + "--" + file.originalname);
    }
});

const multerUpload = multer({
    storage: fileStorageEngine
});

async function checkIfPresent(res, databaseConnection, id) {
    try {
        let querySelectIdStatement =
            "SELECT user.id " +
            "FROM user " +
            "WHERE user.id = ?;";

        let selectedUserId = await databaseConnection.query(querySelectIdStatement, id);

        return selectedUserId.length != 0;
    }

    catch (e) {
        console.log(e);
        return res.status(500).json({ error: "Server error" })
    }
}

async function checkUsernameOwnership(res, databaseConnection, username, id) {
    try {
        let querySelectUsernameStatement =
            "SELECT username FROM user " +
            "WHERE user.username = ? " +
            "AND user.id = ?;";

        let selectedUsername = await databaseConnection.query(querySelectUsernameStatement, [username, id]);

        return selectedUsername.length != 0;
    }

    catch (e) {
        console.log(e);
        return res.status(500).json({ error: "Server error" })
    }
}

async function checkIfUsernameIsTaken(res, databaseConnection, username) {
    try {
        let querySelectUsernameStatement =
            "SELECT username FROM user " +
            "WHERE user.username = ?;";

        let selectedUsername = await databaseConnection.query(querySelectUsernameStatement, username);

        return selectedUsername.length != 0;
    }

    catch (e) {
        console.log(e);
        return res.status(500).json({ error: "Server error" })
    }
}

async function checkEmailOwnership(res, databaseConnection, email, id) {
    try {
        let querySelectEmailStatement =
            "SELECT email FROM user " +
            "WHERE user.email = ? " +
            "AND user.id = ?;";

        let selectedUserEmail = await databaseConnection.query(querySelectEmailStatement, [email, id]);

        return selectedUserEmail.length != 0;
    }

    catch (e) {
        console.log(e);
        return res.status(500).json({ error: "Server error" })
    }
}

async function checkIfEmailIsTaken(res, databaseConnection, email) {
    try {
        let querySelectEmailStatement =
            "SELECT email FROM user " +
            "WHERE user.email = ?;";

        let selectedUserEmail = await databaseConnection.query(querySelectEmailStatement, email);

        return selectedUserEmail.length != 0;
    }

    catch (e) {
        console.log(e);
        return res.status(500).json({ error: "Server error" })
    }
}

module.exports = function (express, connectionPool) {
    let apiRouter = express.Router();

    apiRouter.use(tokenValidation());

    apiRouter.route("/:id")
        .get(async function (req, res) {
            try {
                const token = req.body.token || req.params.token || req.headers["x-access-token"] || req.query.token;

                let tokenId;

                jwt.verify(token, config.secret, function (err, decoded) {
                    tokenId = decoded.id;
                });

                const paramsId = req.params.id;

                if (tokenId != paramsId) {
                    return res.status(403).json({
                        status: 403,
                        message: "Params id doesn't match with the token id"
                    });
                }

                let databaseConnection = await connectionPool.getConnection();

                let isPresent = await checkIfPresent(res, databaseConnection, paramsId);

                if (!isPresent) {
                    return res.status(404).json({
                        status: 404,
                        message: "No user found under the id : " + paramsId
                    });
                }

                let querySelectStatement =
                    "SELECT user.id AS 'id', username, email, imagePath, " +
                    "dateOfCreation, deleted, authority.title AS 'authorityTitle', " +
                    "authority.level AS 'authorityLevel' " +
                    "FROM user " +
                    "LEFT JOIN authority ON user.authorityId = authority.id " +
                    "WHERE user.id = ?;";

                let selectedUser = await databaseConnection.query(querySelectStatement, paramsId);

                databaseConnection.release();

                res.status(200).json({ selectedUser });

            } catch (e) {
                console.log(e);
                return res.status(500).json({ error: "Server error" })
            }
        })

        .put(multerUpload.single("image"), async function (req, res) {
            try {
                const token = req.body.token || req.params.token || req.headers["x-access-token"] || req.query.token;

                let tokenId;

                jwt.verify(token, config.secret, function (err, decoded) {
                    tokenId = decoded.id;
                });

                const paramsId = req.params.id;

                if (tokenId != paramsId) {
                    return res.status(403).json({
                        status: 403,
                        message: "Params id doesn't match with the token id"
                    });
                }

                if (req.file) {
                    let imagePath = req.file.destination + req.file.filename;
                    imagePath = imagePath.replace("\\", "/");

                    user = {
                        username: req.body.username,
                        email: req.body.email,
                        imagePath: imagePath,
                    };

                } else if (!req.file) {
                    user = {
                        username: req.body.username,
                        email: req.body.email
                    };
                }

                let databaseConnection = await connectionPool.getConnection();

                let isPresent = await checkIfPresent(res, databaseConnection, paramsId);

                if (!isPresent) {
                    return res.status(404).json({
                        status: 404,
                        message: "No user found under the id : " + paramsId
                    });
                }

                let usernameOwnership = await checkUsernameOwnership(res, databaseConnection, req.body.username, paramsId);

                if (!usernameOwnership) {
                    let usernameIsTaken = await checkIfUsernameIsTaken(res, databaseConnection, req.body.username);

                    if (usernameIsTaken) {
                        return res.status(409).json({ error: "Username taken" });
                    }
                }

                let emailOwnership = await checkEmailOwnership(res, databaseConnection, req.body.email, paramsId);

                if (!emailOwnership) {
                    let emailIsTaken = await checkIfEmailIsTaken(res, databaseConnection, req.body.email);

                    if (emailIsTaken) {
                        return res.status(409).json({ error: "Email taken" });
                    }
                }

                let queryUpdateStatement =
                    "UPDATE user SET ? " +
                    "WHERE user.id = ?;";

                let query = await databaseConnection.query(queryUpdateStatement, [user, paramsId]);

                let querySelectStatement =
                    "SELECT user.id AS 'id', username, email, imagePath, " +
                    "dateOfCreation, deleted, authority.title AS 'authorityTitle', " +
                    "authority.level AS 'authorityLevel' " +
                    "FROM user " +
                    "LEFT JOIN authority ON user.authorityId = authority.id " +
                    "WHERE user.id = ?;";

                let selectedUser = await databaseConnection.query(querySelectStatement, paramsId);

                databaseConnection.release();

                res.status(200).json({ selectedUser });

            } catch (e) {
                console.log(e);
                return res.status(500).json({ error: "Server error" })
            }
        })

        .delete(async function (req, res) {
            try {
                const token = req.body.token || req.params.token || req.headers["x-access-token"] || req.query.token;

                let tokenId;

                jwt.verify(token, config.secret, function (err, decoded) {
                    tokenId = decoded.id;
                });

                const paramsId = req.params.id;

                if (tokenId != paramsId) {
                    return res.status(403).json({
                        status: 403,
                        message: "Params id doesn't match with the token id"
                    });
                }

                let databaseConnection = await connectionPool.getConnection();

                let isPresent = await checkIfPresent(res, databaseConnection, paramsId);

                if (!isPresent) {
                    return res.status(404).json({
                        status: 404,
                        message: "No user found under the id : " + paramsId
                    });
                }

                let queryDeleteStatement =
                    "UPDATE user " +
                    "SET user.deleted = '1' " +
                    "WHERE user.id = ?;";

                let query = await databaseConnection.query(queryDeleteStatement, paramsId);

                databaseConnection.release();

                res.status(200).json({ affectedRows: query.affectedRows });

            } catch (e) {
                console.log(e);
                return res.status(500).json({ error: "Server error" })
            }
        });

    return apiRouter;
};