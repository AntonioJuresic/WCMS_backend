async function checkIfPresent(res, databaseConnection, name) {
    try {
        let querySelectStatement =
            "SELECT category.name " +
            "FROM category " +
            "WHERE category.name = ? ";

        let selectedCategoryName = await databaseConnection.query(querySelectStatement, name);

        return selectedCategoryName.length != 0
    }

    catch (e) {
        console.log(e);
        return res.status(500).json({ error: "Server error" })
    }
}

module.exports = function (express, connectionPool) {
    let apiRouter = express.Router();

    apiRouter.route("/:name")
        .get(async function (req, res) {
            try {
                let databaseConnection = await connectionPool.getConnection();

                let isPresent = await checkIfPresent(res, databaseConnection, req.params.name);

                if (!isPresent) {
                    return res.status(404).json({
                        status: 404,
                        message: "No category found under the name : " + req.params.name
                    });
                }

                let querySelectCategoryStatement =
                    "SELECT * FROM category " +
                    "WHERE category.name = ?;";

                let selectedCategory = await databaseConnection.query(querySelectCategoryStatement, req.params.name);


                let querySelectPostsStatement =
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
                    "AND category.name = ? " +
                    "ORDER BY post.dateOfCreation DESC;";

                let selectedPosts = await databaseConnection.query(querySelectPostsStatement, req.params.name);

                databaseConnection.release();

                if (selectedPosts.length == 0) {
                    return res.status(404).json({
                        status: 404,
                        message: "No posts found under the category name : " + req.params.name
                    });
                }

                res.status(200).json({
                    selectedCategory,
                    selectedPosts
                });

            } catch (e) {
                console.log(e);
                return res.status(500).json({ error: "Server error" })
            }
        })

    return apiRouter;
};