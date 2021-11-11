const tokenValidation = require("../token-validation");
const authorityValidation = require("../authority-validation");

const config = require("../../config");

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

async function checkIfPresent(res, databaseConnection) {
    try {
        let querySelectIdStatement =
            "SELECT meta.id " +
            "FROM meta " +
            "WHERE meta.id = 1;";

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
                    "SELECT title, imagePath, charset, " +
                    "keywords, description, author, viewport " +
                    "FROM meta " +
                    "WHERE meta.id = 1;"

                let selectedMeta = await databaseConnection.query(querySelectStatement);

                databaseConnection.release();

                if (selectedMeta.length == 0) {
                    return res.status(404).json({
                        status: 404,
                        message: "Website info not set"
                    });
                }

                res.status(200).json({ selectedMeta })

            } catch (e) {
                console.log(e);

                return res.status(500).json({ error: "Server error" })
            }
        })

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

                const meta = {
                    title: req.body.title,
                    imagePath: imagePath,
                    charset: req.body.charset,
                    keywords: req.body.keywords,
                    description: req.body.description,
                    author: req.body.author,
                    viewport: req.body.viewport,
                    id: 1
                };

                let databaseConnection = await connectionPool.getConnection();

                let isPresent = await checkIfPresent(res, databaseConnection);

                if (isPresent) {
                    return res.status(409).json({
                        status: 409,
                        message: "Meta info is already in the database. " +
                            "You can change it by sending a put request."
                    });
                }

                let queryInsertStatement =
                    "INSERT INTO meta SET ?;";

                await databaseConnection.query(queryInsertStatement, meta);

                let querySelectStatement =
                    "SELECT title, imagePath, charset, " +
                    "keywords, description, author, viewport " +
                    "FROM meta " +
                    "WHERE meta.id = 1;"

                let selectedMeta = await databaseConnection.query(querySelectStatement);
                databaseConnection.release();

                res.status(201).json({ selectedMeta });

            } catch (e) {
                if (req.file) {
                    let imagePath = req.file.destination + req.file.filename;
                    imagePath = imagePath.replace("\\", "/");

                    await deleteFile(imagePath);
                }

                console.log(e);
                return res.status(500).json({ error: "Server error" })
            }
        })

    apiRouter.route("/")
        .put(multerUpload.single("image"), async function (req, res) {
            try {
                let databaseConnection = await connectionPool.getConnection();

                if (req.file) {
                    let imagePath = req.file.destination + req.file.filename;
                    imagePath = imagePath.replace("\\", "/");

                    meta = {
                        title: req.body.title,
                        imagePath: imagePath,
                        charset: req.body.charset,
                        keywords: req.body.keywords,
                        description: req.body.description,
                        author: req.body.author,
                        viewport: req.body.viewport,
                        id: 1
                    };

                    let querySelectImagePathStatement =
                        "SELECT meta.imagePath " +
                        "FROM meta " +
                        "WHERE meta.id = ?;";

                    let selectedImagePath = await databaseConnection.query(querySelectImagePathStatement, id);

                    await deleteFile(selectedImagePath[0].imagePath);


                } else if (!req.file) {
                    meta = {
                        title: req.body.title,
                        charset: req.body.charset,
                        keywords: req.body.keywords,
                        description: req.body.description,
                        author: req.body.author,
                        viewport: req.body.viewport,
                        id: 1
                    };
                }

                let queryUpdateStatement =
                    "UPDATE meta SET ? " +
                    "WHERE meta.id = 1";

                await databaseConnection.query(queryUpdateStatement, meta);

                let querySelectStatement =
                    "SELECT title, imagePath, charset, " +
                    "keywords, description, author, viewport " +
                    "FROM meta " +
                    "WHERE meta.id = 1;"

                let selectedMeta = await databaseConnection.query(querySelectStatement);
                databaseConnection.release();

                res.status(200).json({ selectedMeta });

            } catch (e) {
                if (req.file) {
                    let imagePath = req.file.destination + req.file.filename;
                    imagePath = imagePath.replace("\\", "/");

                    await deleteFile(imagePath);
                }

                console.log(e);
                return res.status(500).json({ error: "Server error" })
            }
        })

    return apiRouter;
};