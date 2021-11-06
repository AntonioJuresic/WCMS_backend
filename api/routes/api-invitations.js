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

function sendInvitationEmail(emailAddress, emailSubject, emailMessage, code) {
    try {
        const transporter = nodemailer.createTransport({
            service: "hotmail",
            auth: {
                user: config.auth.user,
                pass: config.auth.pass
            }
        });

        const options = {
            from: config.auth.user,
            to: emailAddress,
            subject: emailSubject,
            text: emailMessage + code
        };

        transporter.sendMail(options, function (err, info) {
            if (err) {
                console.log(err);
            }

            console.log(info.response);
        });
    }

    catch (e) {
        console.log(e);
        return res.status(500).json({ error: "Server error" })
    }
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
                    code: req.body.code,
                    emailAddress: req.body.emailAddress,
                    emailSubject: req.body.emailSubject,
                    emailMessage: req.body.emailMessage,
                    authorityId: req.body.authorityId
                };

                let databaseConnection = await connectionPool.getConnection();

                let authorityExists = await checkIfAuthorityExists(res, databaseConnection, invitation.authorityId);

                if (!authorityExists) {
                    return res.status(404).json({
                        status: 404,
                        message: "No authority found under the id : " + invitation.authorityId
                    });
                }

                if (req.body.emailAddress != undefined || req.body.emailSubject != undefined
                    || req.body.emailMessage != undefined) {
                    sendInvitationEmail(req.body.emailAddress, req.body.emailSubject,
                        req.body.emailMessage, req.body.code);
                } else {
                    return res.status(409).json({ status: 409 });
                }

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
                    code: req.body.code,
                    emailAddress: req.body.emailAddress,
                    emailSubject: req.body.emailSubject,
                    emailMessage: req.body.emailMessage,
                    authorityId: req.body.authorityId
                };

                let databaseConnection = await connectionPool.getConnection();

                let authorityExists = await checkIfAuthorityExists(res, databaseConnection, invitation.authorityId);

                if (!authorityExists) {
                    return res.status(404).json({
                        status: 404,
                        message: "No authority found under the id : " + authority.id
                    });
                }

                if (req.body.emailAddress != undefined || req.body.emailSubject != undefined
                    || req.body.emailMessage != undefined) {
                    sendInvitationEmail(req.body.emailAddress, req.body.emailSubject,
                        req.body.emailMessage, req.body.code);
                } else {
                    return res.status(409).json({ status: 409 });
                }

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