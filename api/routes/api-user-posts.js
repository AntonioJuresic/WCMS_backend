async function checkIfPresent(res, databaseConnection, username) {
    try {
        let querySelectStatement =
            "SELECT user.username " +
            "FROM user " +
            "WHERE user.username = ?;";

        let selectedUserUsername = await databaseConnection.query(querySelectStatement, username);

        return selectedUserUsername.length != 0;
    }

    catch (e) {
        console.log(e);
        return res.status(500).json({ error: "Server error" })
    }
}

module.exports = function (express, connectionPool) {
    let apiRouter = express.Router();

    apiRouter.route("/:username")
        .get(async function (req, res) {
            const username = req.params.username;

            try {
                let databaseConnection = await connectionPool.getConnection();

                let isPresent = await checkIfPresent(res, databaseConnection, username);

                if (!isPresent) {
                    return res.status(404).json({
                        status: 404,
                        message: "No user found under the username : " + username
                    });
                }

                let querySelectUserStatement =
                    "SELECT user.id AS 'id', username, email, imagePath, " +
                    "dateOfCreation, authority.title AS 'authorityTitle', " +
                    "authority.level AS 'authorityLevel' " +
                    "FROM user " +
                    "LEFT JOIN authority ON user.authorityId = authority.id " +
                    "WHERE user.deleted = 0 " +
                    "AND user.username = ?;";

                let selectedUser = await databaseConnection.query(querySelectUserStatement, req.params.username);

                let querySelectStatement =
                    "SELECT post.id, post.title, " +
                    "post.imagePath, post.content, " +
                    "post.dateOfCreation, " +
                    "post.userId, post.categoryId, " +
                    "user.username AS userUsername, " +
                    "category.name AS categoryName " +
                    "FROM post " +
                    "INNER JOIN USER ON post.userId = user.id " +
                    "INNER JOIN category ON post.categoryId = category.id " +
                    "WHERE user.deleted = 0 " +
                    "AND user.username = ? " +
                    "ORDER BY post.dateOfCreation DESC;";

                let selectedPosts = await databaseConnection.query(querySelectStatement, req.params.username);

                databaseConnection.release();

                res.status(200).json({
                    selectedUser,
                    selectedPosts
                })

            } catch (e) {
                console.log(e);
                return res.status(500).json({ error: "Server error" })
            }
        })

    return apiRouter;
};