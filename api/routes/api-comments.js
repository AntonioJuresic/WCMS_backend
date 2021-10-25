const tokenValidation = require("../token-validation");
const authorityValidation = require("../authority-validation");

const config = require("../../config");
const dateISOToMySQL = require("../../util/date-iso-to-mysql");

const jwt = require("jsonwebtoken");

async function checkIfPresent(res, databaseConnection, id) {
    try {
        let querySelectStatement =
            "SELECT comment.id " +
            "FROM comment " +
            "WHERE comment.id = ?;";

        let selectedCommentId = await databaseConnection.query(querySelectStatement, id);

        return selectedCommentId.length != 0
    }

    catch (e) {
        console.log(e);
        return res.status(500).json({ error: "Server error" })
    }
}

async function checkIfUserExists(res, databaseConnection, id) {
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

async function checkIfPostExists(res, databaseConnection, id) {
    try {
        let querySelectIdStatement =
            "SELECT post.id " +
            "FROM post " +
            "WHERE post.id = ?;";

        let selectedPostId = await databaseConnection.query(querySelectIdStatement, id);

        return selectedPostId.length != 0;
    }

    catch (e) {
        console.log(e);
        return res.status(500).json({ error: "Server error" })
    }
}

module.exports = function (express, connectionPool) {
    let apiRouter = express.Router();

    apiRouter.route("/")
        .get(async function (req, res) {
            try {
                let databaseConnection = await connectionPool.getConnection();

                let querySelectStatement =
                    "SELECT comment.id, comment.content, comment.dateOfCreation, " +
                    "post.id AS 'postId', post.title AS 'postTitle', " +
                    "user.id AS 'userId', user.username AS 'userUsername' " +
                    "FROM COMMENT " +
                    "INNER JOIN post ON comment.postId = post.id " +
                    "INNER JOIN user ON comment.userId = user.id " +
                    "ORDER BY comment.dateOfCreation DESC;";

                let selectedComments = await databaseConnection.query(querySelectStatement);

                databaseConnection.release();

                res.status(200).json({ selectedComments })

            } catch (e) {
                console.log(e);
                return res.status(500).json({ error: "Server error" })
            }
        })

    apiRouter.route("/:id")
        .get(async function (req, res) {
            try {
                let databaseConnection = await connectionPool.getConnection();

                let querySelectStatement =
                    "SELECT comment.id, comment.content, comment.dateOfCreation, " +
                    "post.id AS 'postId', post.title AS 'postTitle', " +
                    "user.id AS 'userId', user.username AS 'userUsername' " +
                    "FROM COMMENT " +
                    "INNER JOIN post ON comment.postId = post.id " +
                    "INNER JOIN user ON comment.userId = user.id " +
                    "WHERE comment.id = ? " +
                    "ORDER BY comment.dateOfCreation DESC;";

                let selectedComment = await databaseConnection.query(querySelectStatement, req.params.id);

                databaseConnection.release();

                if (selectedComment.length == 0) {
                    return res.status(404).json({
                        status: 404,
                        message: "No comment found under the id : " + req.params.id
                    });
                }

                res.status(200).json({ selectedComment })

            } catch (e) {
                console.log(e);
                return res.status(500).json({ error: "Server error" })
            }
        })

    apiRouter.use(tokenValidation());

    apiRouter.route("/")
        .post(async function (req, res) {
            try {
                const token = req.body.token || req.params.token || req.headers["x-access-token"] || req.query.token;

                let tokenId;

                jwt.verify(token, config.secret, function (err, decoded) {
                    tokenId = decoded.id;
                });

                const userId = req.body.userId;

                if (tokenId != userId) {
                    return res.status(403).json({
                        status: 403,
                        message: "User id doesn't match with the token id"
                    });
                }

                const comment = {
                    content: req.body.content,
                    dateOfCreation: dateISOToMySQL(Date.now()),
                    userId: req.body.userId,
                    postId: req.body.postId
                };

                let databaseConnection = await connectionPool.getConnection();

                let doesUserExists = await checkIfUserExists(res, databaseConnection, comment.userId);

                if (!doesUserExists) {
                    return res.status(404).json({
                        status: 404,
                        message: "No user found under the id : " + comment.userId
                    });
                }

                let doesPostExists = await checkIfPostExists(res, databaseConnection, comment.postId);

                if (!doesPostExists) {
                    return res.status(404).json({
                        status: 404,
                        message: "No post found under the id : " + comment.postId
                    });
                }

                let queryInsertStatement = "INSERT INTO comment SET ?";
                let query = await databaseConnection.query(queryInsertStatement, comment);

                let querySelectStatement =
                    "SELECT comment.id, comment.content, comment.dateOfCreation, " +
                    "post.id AS 'postId', post.title AS 'postTitle', " +
                    "user.id AS 'userId', user.username AS 'userUsername' " +
                    "FROM COMMENT " +
                    "INNER JOIN post ON comment.postId = post.id " +
                    "INNER JOIN user ON comment.userId = user.id " +
                    "WHERE comment.id = ? " +
                    "ORDER BY comment.dateOfCreation DESC;";

                let selectedComment = await databaseConnection.query(querySelectStatement, query.insertId);

                databaseConnection.release();

                res.status(201).json({ selectedComment });

            } catch (e) {
                console.log(e);
                return res.status(500).json({ error: "Server error" })
            }
        });

    apiRouter.route("/:id")
        .put(async function (req, res) {
            try {
                const token = req.body.token || req.params.token || req.headers["x-access-token"] || req.query.token;

                let tokenId;

                jwt.verify(token, config.secret, function (err, decoded) {
                    tokenId = decoded.id;
                });

                const userId = req.body.userId;

                if (tokenId != userId) {
                    return res.status(403).json({
                        status: 403,
                        message: "User id doesn't match with the token id"
                    });
                }

                const id = req.params.id;

                const comment = {
                    content: req.body.content,
                    userId: req.body.userId,
                    postId: req.body.postId
                };

                let databaseConnection = await connectionPool.getConnection();

                let isPresent = await checkIfPresent(res, databaseConnection, id);

                if (!isPresent) {
                    return res.status(404).json({
                        status: 404,
                        message: "No comment found under the id : " + id
                    });
                }

                let queryUpdateStatement =
                    "UPDATE comment SET ? " +
                    "WHERE comment.id = ?;";

                let query = await databaseConnection.query(queryUpdateStatement, [comment, id]);

                let querySelectStatement =
                    "SELECT comment.id, comment.content, comment.dateOfCreation, " +
                    "post.id AS 'postId', post.title AS 'postTitle', " +
                    "user.id AS 'userId', user.username AS 'userUsername' " +
                    "FROM COMMENT " +
                    "INNER JOIN post ON comment.postId = post.id " +
                    "INNER JOIN user ON comment.userId = user.id " +
                    "WHERE comment.id = ?";

                let selectedComment = await databaseConnection.query(querySelectStatement, id);

                databaseConnection.release();

                res.status(200).json({ selectedComment });

            } catch (e) {
                console.log(e);
                return res.status(500).json({ error: "Server error" })
            }
        });

    apiRouter.use(authorityValidation());

    apiRouter.route("/:id")
        .delete(async function (req, res) {
            const id = req.params.id;

            try {
                let databaseConnection = await connectionPool.getConnection();

                let isPresent = await checkIfPresent(res, databaseConnection, id);

                if (!isPresent) {
                    return res.status(404).json({
                        status: 404,
                        message: "No comment found under the id : " + id
                    });
                }

                let queryDeleteStatement =
                    "DELETE FROM comment " +
                    "WHERE comment.id = ?";

                let query = await databaseConnection.query(queryDeleteStatement, id);

                databaseConnection.release();

                res.status(200).json({ affectedRows: query.affectedRows });

            } catch (e) {
                console.log(e);
                return res.status(500).json({ error: "Server error" })
            }
        });

    return apiRouter;
};