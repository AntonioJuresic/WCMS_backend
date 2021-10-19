async function checkIfPresent(res, databaseConnection, id) {
    try {
        let querySelectStatement =
            "SELECT post.id " +
            "FROM post " +
            "WHERE post.id = ?;";

        let selectedPostId = await databaseConnection.query(querySelectStatement, id);

        return selectedPostId.length != 0;
    }

    catch (e) {
        console.log(e);
        return res.status(500).json({ error: "Server error" })
    }
}

module.exports = function (express, connectionPool) {
    let apiRouter = express.Router();


    apiRouter.route("/:id")
        .get(async function (req, res) {

            const id = req.params.id;

            try {
                let databaseConnection = await connectionPool.getConnection();

                let isPresent = await checkIfPresent(res, databaseConnection, id);

                if (!isPresent) {
                    return res.status(404).json({
                        status: 404,
                        message: "No post found under the id : " + id
                    });
                }

                let querySelectStatement =
                    "SELECT comment.id, comment.content, comment.dateOfCreation, " +
                    "user.id AS 'userId', user.username AS 'userUsername' " +
                    "FROM COMMENT " +
                    "INNER JOIN post ON comment.postId = post.id " +
                    "INNER JOIN user ON comment.userId = user.id " +
                    "WHERE post.id = ? " +
                    "ORDER BY comment.dateOfCreation DESC;";

                let selectedComments = await databaseConnection.query(querySelectStatement, id);

                databaseConnection.release();

                res.status(200).json({ selectedComments });

            } catch (e) {
                console.log(e);
                return res.status(500).json({ error: "Server error" })
            }
        })

    return apiRouter;
};