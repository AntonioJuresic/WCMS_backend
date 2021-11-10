const tokenValidation = require("../token-validation");
const authorityValidation = require("../authority-validation");

async function checkIfPresent(res, databaseConnection) {
    try {
        let querySelectIdStatement =
            "SELECT header.id " +
            "FROM header " +
            "WHERE header.id = 1;";

        let selectedWebsiteId = await databaseConnection.query(querySelectIdStatement);

        return selectedWebsiteId.length != 0;
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
                    "SELECT content " +
                    "FROM header " +
                    "WHERE header.id = 1;"

                let selectedHeader = await databaseConnection.query(querySelectStatement);

                databaseConnection.release();

                res.status(200).json({ selectedHeader })

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
                const header = {
                    id: 1,
                    content: req.body.content
                };

                let databaseConnection = await connectionPool.getConnection();

                let isPresent = await checkIfPresent(res, databaseConnection);

                if (isPresent) {
                    return res.status(409).json({
                        status: 409,
                        message: "Header is already in the database. " +
                            "You can change it by sending a put request."
                    });
                }

                let queryInsertStatement =
                    "INSERT INTO header SET ?;";

                await databaseConnection.query(queryInsertStatement, header);

                let querySelectStatement =
                    "SELECT content " +
                    "FROM header " +
                    "WHERE header.id = 1;"

                let selectedHeader = await databaseConnection.query(querySelectStatement);

                databaseConnection.release();

                res.status(201).json({ selectedHeader });

            } catch (e) {
                console.log(e);
                return res.status(500).json({ error: "Server error" })
            }
        })

    apiRouter.route("/")
        .put(async function (req, res) {
            try {
                const header = {
                    id: 1,
                    content: req.body.content
                };

                let databaseConnection = await connectionPool.getConnection();

                let queryUpdateStatement =
                    "UPDATE header SET ? " +
                    "WHERE header.id = 1";

                await databaseConnection.query(queryUpdateStatement, header);

                let querySelectStatement =
                    "SELECT content " +
                    "FROM header " +
                    "WHERE header.id = 1;"

                let selectedHeader = await databaseConnection.query(querySelectStatement);

                databaseConnection.release();

                res.status(200).json({ selectedHeader });

            } catch (e) {
                console.log(e);
                return res.status(500).json({ error: "Server error" })
            }
        })

    return apiRouter;
};