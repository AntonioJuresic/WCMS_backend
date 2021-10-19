const tokenValidation = require("../token-validation");

async function checkIfPresent(res, databaseConnection) {
    try {
        let querySelectIdStatement =
            "SELECT website.id " +
            "FROM website " +
            "WHERE website.id = 1;";

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

                let queryUpdateStatement =
                    "SELECT title, description " +
                    "FROM website " +
                    "WHERE website.id = 1;"

                let selectedWebsiteInfo = await databaseConnection.query(queryUpdateStatement);
                databaseConnection.release();

                res.status(200).json({ selectedWebsiteInfo })

            } catch (e) {
                console.log(e);

                return res.status(500).json({ error: "Server error" })
            }
        })

    apiRouter.use(tokenValidation());

    apiRouter.route("/")
        .post(async function (req, res) {
            const websiteInfo = {
                title: req.body.title,
                description: req.body.description,
                id: 1
            };

            try {
                let databaseConnection = await connectionPool.getConnection();

                let isPresent = await checkIfPresent(res, databaseConnection);

                if (isPresent) {
                    return res.status(409).json({
                        status: 409,
                        message: "Website info is already in the database. " +
                            "You can change it by sending a post request."
                    });
                }

                let queryInsertStatement =
                    "INSERT INTO website SET ?;";

                let query = await databaseConnection.query(queryInsertStatement, websiteInfo);

                let querySelectStatement =
                    "SELECT title, description FROM website " +
                    "WHERE website.id = 1;";

                let selectedWebsiteInfo = await databaseConnection.query(querySelectStatement);
                databaseConnection.release();

                res.status(201).json({ selectedWebsiteInfo });

            } catch (e) {
                console.log(e);
                return res.status(500).json({ error: "Server error" })
            }
        })

    apiRouter.route("/")
        .put(async function (req, res) {
            const websiteInfo = {
                title: req.body.title,
                description: req.body.description
            };

            try {
                let databaseConnection = await connectionPool.getConnection();

                let queryUpdateStatement =
                    "UPDATE website SET ? " +
                    "WHERE website.id = 1";

                let query = await databaseConnection.query(queryUpdateStatement, websiteInfo);

                let querySelectStatement =
                    "SELECT title, description FROM website " +
                    "WHERE website.id = 1;";

                let selectedWebsiteInfo = await databaseConnection.query(querySelectStatement);
                databaseConnection.release();

                res.status(200).json({ selectedWebsiteInfo });

            } catch (e) {
                console.log(e);
                return res.status(500).json({ error: "Server error" })
            }
        })

    return apiRouter;
};