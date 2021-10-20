const tokenValidation = require("../token-validation");

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

async function checkIfAuthorityExists(res, databaseConnection, id) {
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

module.exports = function (express, connectionPool) {
    let apiRouter = express.Router();

    //apiRouter.use(tokenValidation());
    
    apiRouter.route("/:id")
        .put(async function (req, res) {
            try {
                const id = req.params.id;

                const authority = {
                    id: req.body.id
                };

                let databaseConnection = await connectionPool.getConnection();

                let userExists = await checkIfUserExists(res, databaseConnection, id);
                
                if (!userExists) {
                    return res.status(404).json({
                        status: 404,
                        message: "No user found under the id : " + id
                    });
                }

                let authorityExists = await checkIfAuthorityExists(res, databaseConnection, authority.id);

                if (!authorityExists) {
                    return res.status(404).json({
                        status: 404,
                        message: "No authority found under the id : " + authority.id
                    });
                }

                let queryUpdateStatement =
                    "UPDATE user " +
                    "SET user.authorityId = ? " +
                    "WHERE user.id = ?;";

                let query = await databaseConnection.query(queryUpdateStatement, [authority.id, id]);

                let querySelectStatement =
                    "SELECT user.id AS 'id', username, email, imagePath, " +
                    "dateOfCreation, deleted, authority.title AS 'authorityTitle' " +
                    "FROM user " +
                    "INNER JOIN authority ON user.authorityId = authority.id " +
                    "WHERE user.id = ?;";

                let selectedUser = await databaseConnection.query(querySelectStatement, id);

                databaseConnection.release();

                res.status(200).json({ selectedUser });

            } catch (e) {
                console.log(e);
                return res.status(500).json({ error: "Server error" })
            }
        });

    return apiRouter;
};