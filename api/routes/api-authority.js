const tokenValidation = require("../token-validation");
const authorityValidation = require("../authority-validation");

async function checkIfPresent(res, databaseConnection, id) {
    try {
        let querySelectStatement =
            "SELECT authority.id " +
            "FROM authority " +
            "WHERE authority.id = ?;";

        let selectedAuthorityId = await databaseConnection.query(querySelectStatement, id);

        return selectedAuthorityId.length != 0
    }

    catch (e) {
        console.log(e);
        return res.status(500).json({ error: "Server error" })
    }
}

async function checkTitleOwnership(res, databaseConnection, title, id) {
    try {
        let querySelectNameStatement =
            "SELECT authority.title " +
            "FROM authority " +
            "WHERE authority.title = ? " +
            "AND authority.id = ?;";

        let selectedTitle = await databaseConnection.query(querySelectNameStatement, [title, id]);

        return selectedTitle.length != 0;
    }

    catch (e) {
        console.log(e);
        return res.status(500).json({ error: "Server error" })
    }
}

async function checkIfTitleIsTaken(res, databaseConnection, title) {
    try {
        let querySelectMameStatement =
            "SELECT authority.title " +
            "FROM authority " +
            "WHERE authority.title = ?;";

        let selectedTitle = await databaseConnection.query(querySelectMameStatement, title);

        return selectedTitle.length != 0;
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

                let querySelectStatement = "SELECT * FROM authority;";

                let selectedAuthorities = await databaseConnection.query(querySelectStatement);

                databaseConnection.release();

                res.status(200).json({ selectedAuthorities })

            } catch (e) {
                console.log(e);
                return res.status(500).json({ error: "Server error" })
            }
        });

    apiRouter.route("/:id")
        .get(async function (req, res) {
            try {
                let databaseConnection = await connectionPool.getConnection();

                let querySelectStatement =
                    "SELECT * FROM authority " +
                    "WHERE authority.id = ?;";

                let selectedAuthority = await databaseConnection.query(querySelectStatement, req.params.id);

                databaseConnection.release();

                if (selectedAuthority.length == 0) {
                    return res.status(404).json({
                        status: 404,
                        message: "No authority found under the id : " + req.params.id
                    });
                }

                res.status(200).json({ selectedAuthority })

            } catch (e) {
                console.log(e);
                return res.status(500).json({ error: "Server error" })
            }
        })

    apiRouter.use(tokenValidation());
    apiRouter.use(authorityValidation());

    apiRouter.route("/")
        .post(async function (req, res) {
            try {
                const authority = {
                    level: req.body.level,
                    title: req.body.title
                };

                let databaseConnection = await connectionPool.getConnection();

                let titleIsTaken = await checkIfTitleIsTaken(res, databaseConnection, req.body.title);

                if (titleIsTaken) {
                    return res.status(409).json({ error: "Title taken" });
                }

                let queryInsertStatement = "INSERT INTO authority SET ?;";
                let query = await databaseConnection.query(queryInsertStatement, authority);

                let querySelectStatement =
                    "SELECT * FROM authority " +
                    "WHERE authority.id = ?;";

                let selectedAuthority = await databaseConnection.query(querySelectStatement, query.insertId);

                databaseConnection.release();

                res.status(201).json({ selectedAuthority });

            } catch (e) {
                console.log(e);
                return res.status(500).json({ error: "Server error" })
            }
        });

    apiRouter.route("/:id")
        .put(async function (req, res) {
            try {
                const id = req.params.id;

                const authority = {
                    level: req.body.level,
                    title: req.body.title
                };

                let databaseConnection = await connectionPool.getConnection();

                let isPresent = await checkIfPresent(res, databaseConnection, id);

                if (!isPresent) {
                    return res.status(404).json({
                        status: 404,
                        message: "No authority found under the id : " + id
                    });
                }

                let titleOwnership = await checkTitleOwnership(res, databaseConnection, req.body.title, id);

                if (!titleOwnership) {
                    let titleIsTaken = await checkIfTitleIsTaken(res, databaseConnection, req.body.title);

                    if (titleIsTaken) {
                        return res.status(409).json({ error: "Title is taken" });
                    }
                }

                let queryUpdateStatement =
                    "UPDATE authority SET ? " +
                    "WHERE authority.id = ?";

                let query = await databaseConnection.query(queryUpdateStatement, [authority, id]);

                let querySelectStatement =
                    "SELECT * FROM authority " +
                    "WHERE authority.id = ?;";

                let selectedAuthority = await databaseConnection.query(querySelectStatement, id);

                databaseConnection.release();

                res.status(200).json({ selectedAuthority });

            } catch (e) {
                console.log(e);
                return res.status(500).json({ error: "Server error" })
            }
        })

        .delete(async function (req, res) {
            try {
                const id = req.params.id;

                let databaseConnection = await connectionPool.getConnection();

                let isPresent = await checkIfPresent(res, databaseConnection, id);

                if (!isPresent) {
                    return res.status(404).json({
                        status: 404,
                        message: "No authority found under the id : " + id
                    });
                }

                let queryDeleteStatement =
                    "DELETE FROM authority " +
                    "WHERE authority.id = ?";

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