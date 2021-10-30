const tokenValidation = require("../token-validation");
const authorityValidation = require("../authority-validation");

const config = require("../../config");

const nodemailer = require("nodemailer");

async function checkIfPresent(res, databaseConnection, id) {
    try {
        let querySelectStatement =
            "SELECT invitation.id " +
            "FROM invitation " +
            "WHERE invitation.id = ?;";

        let selectedInvitationId = await databaseConnection.query(querySelectStatement, id);

        return selectedInvitationId.length != 0
    }

    catch (e) {
        console.log(e);
        return res.status(500).json({ error: "Server error" })
    }
}

function sendInvitationEmail(email, subject, message, code) {
    const transporter = nodemailer.createTransport({
        service: "hotmail",
        auth: {
            user: config.auth.user,
            pass: config.auth.pass
        }
    });

    const options = {
        from: "ajuresic@tvz.hr",
        to: email,
        subject: subject,
        text: message + code
    };

    transporter.sendMail(options, function (err, info) {
        if (err) {
            console.log(err);
        }

        console.log(info.response);
    });
}

module.exports = function (express, connectionPool) {
    let apiRouter = express.Router();

    apiRouter.use(tokenValidation());
    apiRouter.use(authorityValidation());

    apiRouter.route("/")
        .get(async function (req, res) {
            try {
                let databaseConnection = await connectionPool.getConnection();

                let querySelectStatement =
                    "SELECT * " +
                    "FROM invitation;";

                let selectedInvitations = await databaseConnection.query(querySelectStatement);

                databaseConnection.release();

                res.status(200).json({ selectedInvitations })

            } catch (e) {
                console.log(e);
                return res.status(500).json({ error: "Server error" })
            }
        })

        .post(async function (req, res) {
            try {
                const invitation = {
                    code: req.body.code
                };

                if (req.body.email != undefined || req.body.subject != undefined || req.body.message != undefined) {
                    sendInvitationEmail(req.body.email, req.body.subject, req.body.message, req.body.code);
                } else {
                    return res.status(409).json({ status: 409 });
                }

                let databaseConnection = await connectionPool.getConnection();

                let queryInsertStatement = "INSERT INTO invitation SET ?";
                let query = await databaseConnection.query(queryInsertStatement, invitation);

                let querySelectStatement =
                    "SELECT * " +
                    "FROM invitation " +
                    "WHERE invitation.id = ?;";

                let selectedInvitation = await databaseConnection.query(querySelectStatement, query.insertId);

                databaseConnection.release();

                res.status(201).json({ selectedInvitation });

            } catch (e) {
                console.log(e);
                return res.status(500).json({ error: "Server error" })
            }
        });

    apiRouter.route("/:id")
        .get(async function (req, res) {
            try {
                const id = req.params.id;

                let databaseConnection = await connectionPool.getConnection();

                let querySelectStatement =
                    "SELECT * " +
                    "FROM invitation " +
                    "WHERE invitation.id = ?;";

                let selectedInvitation = await databaseConnection.query(querySelectStatement, id);

                databaseConnection.release();

                if (selectedInvitation.length == 0) {
                    return res.status(404).json({
                        status: 404,
                        message: "No invitation found under the id : " + id
                    });
                }

                res.status(200).json({ selectedInvitation })

            } catch (e) {
                console.log(e);
                return res.status(500).json({ error: "Server error" })
            }
        })

        .put(async function (req, res) {
            try {
                const id = req.params.id;

                const invitation = {
                    code: req.body.code
                };

                if (req.body.email != undefined || req.body.subject != undefined || req.body.message != undefined) {
                    sendInvitationEmail(req.body.email, req.body.subject, req.body.message, req.body.code);
                } else {
                    return res.status(409).json({ status: 409 });
                }

                let databaseConnection = await connectionPool.getConnection();

                let queryUpdateStatement =
                    "UPDATE invitation SET ? " +
                    "WHERE invitation.id = ?;";

                let query = await databaseConnection.query(queryUpdateStatement, [invitation, id]);

                let querySelectStatement =
                    "SELECT * " +
                    "FROM invitation " +
                    "WHERE invitation.id = ?;";

                let selectedInvitation = await databaseConnection.query(querySelectStatement, id);

                databaseConnection.release();

                res.status(201).json({ selectedInvitation });

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
                        message: "No invitation found under the id : " + id
                    });
                }

                let queryDeleteStatement =
                    "DELETE FROM invitation " +
                    "WHERE invitation.id = ?;";

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