const tokenValidation = require("../token-validation");

async function checkIfPresent(res, databaseConnection, id) {
    try {
        let querySelectStatement =
            "SELECT category.id " +
            "FROM category " +
            "WHERE category.id = ?;";

        let selectedCategoryId = await databaseConnection.query(querySelectStatement, id);

        return selectedCategoryId.length != 0
    }

    catch (e) {
        console.log(e);
        return res.status(500).json({ error: "Server error" })
    }
}

async function checkNameOwnership(res, databaseConnection, name, id) {
    try {
        let querySelectNameStatement =
            "SELECT category.name FROM category " +
            "WHERE category.name = ? " +
            "AND category.id = ?;";

        let selectedName = await databaseConnection.query(querySelectNameStatement, [name, id]);

        return selectedName.length != 0;
    }

    catch (e) {
        console.log(e);
        return res.status(500).json({ error: "Server error" })
    }
}

async function checkIfNameIsTaken(res, databaseConnection, name) {
    try {
        let querySelectMameStatement =
            "SELECT category.name FROM category " +
            "WHERE category.name = ?;";

        let selectedName = await databaseConnection.query(querySelectMameStatement, name);

        return selectedName.length != 0;
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

                let querySelectStatement = "SELECT * FROM category;";
                let selectedCategories = await databaseConnection.query(querySelectStatement);

                databaseConnection.release();

                if (selectedCategories.length == 0) {
                    return res.status(404).json({
                        status: 404,
                        message: "No categories found"
                    });
                }

                res.status(200).json({ selectedCategories })

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
                    "SELECT * FROM category " +
                    "WHERE category.id = ?;";

                let selectedCategory = await databaseConnection.query(querySelectStatement, req.params.id);

                databaseConnection.release();

                if (selectedCategory.length == 0) {
                    return res.status(404).json({
                        status: 404,
                        message: "No category found under the id : " + req.params.id
                    });
                }

                res.status(200).json({ selectedCategory })

            } catch (e) {
                console.log(e);
                return res.status(500).json({ error: "Server error" })
            }
        })

    apiRouter.use(tokenValidation());

    apiRouter.route("/")
        .post(async function (req, res) {
            try {
                const category = { name: req.body.name };

                let databaseConnection = await connectionPool.getConnection();

                let nameIsTaken = await checkIfNameIsTaken(res, databaseConnection, req.body.name);

                if (nameIsTaken) {
                    return res.status(409).json({ error: "Name taken" });
                }

                let queryInsertStatement = "INSERT INTO category SET ?";
                let query = await databaseConnection.query(queryInsertStatement, category);

                let querySelectStatement =
                    "SELECT * FROM category " +
                    "WHERE category.id = ?;";

                let selectedCategory = await databaseConnection.query(querySelectStatement, query.insertId);

                databaseConnection.release();

                res.status(201).json({ selectedCategory });

            } catch (e) {
                console.log(e);
                return res.status(500).json({ error: "Server error" })
            }
        });

    apiRouter.route("/:id")
        .put(async function (req, res) {
            try {
                const category = { name: req.body.name };
                const id = req.params.id;

                let databaseConnection = await connectionPool.getConnection();

                let isPresent = await checkIfPresent(res, databaseConnection, id);

                if (!isPresent) {
                    return res.status(404).json({
                        status: 404,
                        message: "No category found under the id : " + id
                    });
                }

                let nameOwnership = await checkNameOwnership(res, databaseConnection, req.body.name, id);

                if (!nameOwnership) {
                    let nameIsTaken = await checkIfNameIsTaken(res, databaseConnection, req.body.name);

                    if (nameIsTaken) {
                        return res.status(409).json({ error: "Name taken" });
                    }
                }

                let queryUpdateStatement =
                    "UPDATE category SET ? " +
                    "WHERE category.id = ?";

                let query = await databaseConnection.query(queryUpdateStatement, [category, id]);

                let querySelectStatement =
                    "SELECT * FROM category " +
                    "WHERE category.id = ?;";

                let selectedCategory = await databaseConnection.query(querySelectStatement, id);

                databaseConnection.release();

                res.status(200).json({ selectedCategory });

            } catch (e) {
                console.log(e);
                return res.status(500).json({ error: "Server error" })
            }
        })

        .delete(async function (req, res) {
            const id = req.params.id;

            try {
                let databaseConnection = await connectionPool.getConnection();

                let isPresent = await checkIfPresent(res, databaseConnection, id);

                if (!isPresent) {
                    return res.status(404).json({
                        status: 404,
                        message: "No category found under the id : " + id
                    });
                }

                let queryDeleteStatement =
                    "DELETE FROM category " +
                    "WHERE category.id = ?";

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