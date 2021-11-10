const tokenValidation = require("../token-validation");
const authorityValidation = require("../authority-validation");

async function checkIfPresent(res, databaseConnection) {
    try {
        let querySelectIdStatement =
            "SELECT footer.id " +
            "FROM footer " +
            "WHERE footer.id = 1;";

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
                    "FROM footer " +
                    "WHERE footer.id = 1;"

                let selectedWebsiteFooter = await databaseConnection.query(querySelectStatement);

                databaseConnection.release();

                res.status(200).json({ selectedWebsiteFooter })

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
                const footer = {
                    id: 1,
                    content: req.body.content
                };

                let databaseConnection = await connectionPool.getConnection();

                let isPresent = await checkIfPresent(res, databaseConnection);

                if (isPresent) {
                    return res.status(409).json({
                        status: 409,
                        message: "Footer is already in the database. " +
                            "You can change it by sending a put request."
                    });
                }

                let queryInsertStatement =
                    "INSERT INTO footer SET ?;";

                await databaseConnection.query(queryInsertStatement, footer);

                let querySelectStatement =
                    "SELECT content " +
                    "FROM footer " +
                    "WHERE footer.id = 1;"

                let selectedWebsiteFooter = await databaseConnection.query(querySelectStatement);

                databaseConnection.release();

                res.status(201).json({ selectedWebsiteFooter });

            } catch (e) {
                console.log(e);
                return res.status(500).json({ error: "Server error" })
            }
        })

    apiRouter.route("/")
        .put(async function (req, res) {
            try {
                const footer = {
                    id: 1,
                    content: req.body.content
                };

                let databaseConnection = await connectionPool.getConnection();

                let queryUpdateStatement =
                    "UPDATE footer SET ? " +
                    "WHERE footer.id = 1";

                await databaseConnection.query(queryUpdateStatement, footer);

                let querySelectStatement =
                    "SELECT content " +
                    "FROM footer " +
                    "WHERE footer.id = 1;"

                let selectedWebsiteFooter = await databaseConnection.query(querySelectStatement);

                databaseConnection.release();

                res.status(200).json({ selectedWebsiteFooter });

            } catch (e) {
                console.log(e);
                return res.status(500).json({ error: "Server error" })
            }
        })

    return apiRouter;
};