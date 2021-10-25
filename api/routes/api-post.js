const tokenValidation = require("../token-validation");
const authorityValidation = require("../authority-validation");

const config = require("../../config");
const dateISOToMySQL = require("../../util/date-iso-to-mysql");

const multer = require("multer");
const { v4: uuidv4 } = require("uuid");

const fileStorageEngine = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, config.uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, uuidv4() + "--" + file.originalname);
    }
});

const multerUpload = multer({
    storage: fileStorageEngine
});

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

async function checkIfCategoryExists(res, databaseConnection, id) {
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

module.exports = function (express, connectionPool) {
    let apiRouter = express.Router();

    apiRouter.route("/")
        .get(async function (req, res) {
            try {
                let databaseConnection = await connectionPool.getConnection();

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
                    "ORDER BY post.dateOfCreation DESC;";

                let selectedPosts = await databaseConnection.query(querySelectStatement);

                databaseConnection.release();

                if (selectedPosts.length == 0) {
                    return res.status(404).json({
                        status: 404,
                        message: "No posts found"
                    });
                }

                res.status(200).json({
                    status: 200,
                    selectedPosts
                })

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
                    "SELECT post.id, post.title, " +
                    "post.imagePath, post.content, " +
                    "post.dateOfCreation, " +
                    "post.userId, post.categoryId, " +
                    "user.username AS userUsername, " +
                    "category.name AS categoryName " +
                    "FROM post " +
                    "INNER JOIN USER ON post.userId = user.id " +
                    "INNER JOIN category ON post.categoryId = category.id " +
                    "WHERE post.id = ?;";

                let selectedPost = await databaseConnection.query(querySelectStatement, req.params.id);

                databaseConnection.release();

                if (selectedPost.length == 0) {
                    return res.status(404).json({
                        status: 404,
                        message: "No post found under the id : " + req.params.id
                    });
                }

                res.status(200).json({
                    status: 200,
                    selectedPost
                })

            } catch (e) {
                console.log(e);
                return res.status(500).json({ error: "Server error" })
            }
        });

    apiRouter.use(tokenValidation());
    apiRouter.use(authorityValidation());

    apiRouter.route("/")
        .post(multerUpload.single("image"), async function (req, res) {
            try {
                if (!req.file) {
                    res.status(400).json({
                        status: 400,
                        message: "No image uploaded"
                    });
                }

                let imagePath = req.file.destination + req.file.filename;
                imagePath = imagePath.replace("\\", "/");

                const post = {
                    title: req.body.title,
                    imagePath: imagePath,
                    content: req.body.content,
                    dateOfCreation: dateISOToMySQL(req.body.dateOfCreation),
                    userId: req.body.userId,
                    categoryId: req.body.categoryId
                };

                let databaseConnection = await connectionPool.getConnection();
                
                let doesUserExists = await checkIfUserExists(res, databaseConnection, post.userId);

                if (!doesUserExists) {
                    return res.status(404).json({
                        status: 404,
                        message: "No user found under the id : " + post.userId
                    });
                }

                let doesCategoryExists = await checkIfCategoryExists(res, databaseConnection, post.categoryId);

                if (!doesCategoryExists) {
                    return res.status(404).json({
                        status: 404,
                        message: "No category found under the id : " + post.categoryId
                    });
                }

                let queryInsertStatement = "INSERT INTO post SET ?";
                let query = await databaseConnection.query(queryInsertStatement, post);

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
                    "WHERE post.id = ?;";

                let selectedPost = await databaseConnection.query(querySelectStatement, query.insertId);

                databaseConnection.release();

                res.status(201).json({
                    status: 201,
                    selectedPost
                });

            } catch (e) {
                console.log(e);
                return res.status(500).json({ error: "Server error" })
            }
        });

    apiRouter.route("/:id")
        .put(multerUpload.single("image"), async function (req, res) {
            try {
                const id = req.params.id;

                if (req.file) {
                    let imagePath = req.file.destination + req.file.filename;
                    imagePath = imagePath.replace("\\", "/");

                    post = {
                        title: req.body.title,
                        imagePath: imagePath,
                        content: req.body.content,
                        dateOfCreation: dateISOToMySQL(req.body.dateOfCreation),
                        userId: req.body.userId,
                        categoryId: req.body.categoryId
                    };

                } else if (!req.file) {
                    post = {
                        title: req.body.title,
                        content: req.body.content,
                        dateOfCreation: dateISOToMySQL(req.body.dateOfCreation),
                        userId: req.body.userId,
                        categoryId: req.body.categoryId
                    };
                }

                let databaseConnection = await connectionPool.getConnection();

                let isPresent = await checkIfPresent(res, databaseConnection, id);

                if (!isPresent) {
                    return res.status(404).json({
                        status: 404,
                        message: "No post found under the id : " + id
                    });
                }

                let doesUserExists = await checkIfUserExists(res, databaseConnection, post.userId);

                if (!doesUserExists) {
                    return res.status(404).json({
                        status: 404,
                        message: "No user found under the id : " + post.userId
                    });
                }

                let doesCategoryExists = await checkIfCategoryExists(res, databaseConnection, post.categoryId);

                if (!doesCategoryExists) {
                    return res.status(404).json({
                        status: 404,
                        message: "No category found under the id : " + post.categoryId
                    });
                }

                let queryUpdateStatement =
                    "UPDATE post SET ? " +
                    "WHERE post.id = ?";

                let query = await databaseConnection.query(queryUpdateStatement, [post, id]);

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
                    "WHERE post.id = ?;";

                let selectedPost = await databaseConnection.query(querySelectStatement, id);

                databaseConnection.release();

                res.status(200).json({
                    status: 200,
                    selectedPost
                });

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
                        message: "No post found under the id : " + id
                    });
                }

                let queryDeleteStatement =
                    "DELETE FROM post " +
                    "WHERE post.id = ?";

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