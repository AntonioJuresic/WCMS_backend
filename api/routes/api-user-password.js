const config = require("../../config");
const dateISOToMySQL = require("../../util/date-iso-to-mysql");

const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");

const nodemailer = require("nodemailer");

async function checkIfValid(res, databaseConnection, code) {
    try {
        let querySelectStatement =
            "SELECT passwordreset.dateOfExpiration " +
            "FROM passwordreset " +
            "WHERE passwordreset.code = ?";

        let selectedDateOfExpiration = await databaseConnection.query(querySelectStatement, code);

        if (selectedDateOfExpiration.length == 0) {
            return false;
        }

        return Date.parse(selectedDateOfExpiration[0].dateOfExpiration) < Date.now()
    }

    catch (e) {
        console.log(e);
        return res.status(500).json({ error: "Server error" })
    }
}

async function checkIfUserExists(res, databaseConnection, email) {
    try {
        let querySelectEmailStatement =
            "SELECT user.email " +
            "FROM user " +
            "WHERE user.email = ?;";

        let selectedUserEmail = await databaseConnection.query(querySelectEmailStatement, email);

        return selectedUserEmail.length != 0;
    }

    catch (e) {
        console.log(e);
        return res.status(500).json({ error: "Server error" })
    }
}

async function getUserId(res, databaseConnection, email) {
    try {
        let querySelectIdStatement =
            "SELECT user.id " +
            "FROM user " +
            "WHERE user.email = ?;";

        let selectedUserId = await databaseConnection.query(querySelectIdStatement, email);

        return selectedUserId[0].id;
    }

    catch (e) {
        console.log(e);
        return res.status(500).json({ error: "Server error" })
    }
}

function sendPasswordResetEmail(emailAddress, code) {
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
            subject: "Password reset",
            text: "You password reset code is: " + code
        };

        transporter.sendMail(options, function (err, info) {
            if (err) {
                console.log(err);
            }

            console.log(info.response);
        });
    } catch (e) {
        console.log(e);
        return res.status(500).json({ error: "Server error" })
    }
}

module.exports = function (express, connectionPool) {
    let apiRouter = express.Router();

    apiRouter.route("/")
        .post(async function (req, res) {
            try {
                let email = req.body.email;

                let databaseConnection = await connectionPool.getConnection();

                let doesUserExists = await checkIfUserExists(res, databaseConnection, email);

                if (!doesUserExists) {
                    return res.status(404).json({
                        status: 404,
                        message: "No user found with the email : " + email
                    });
                }

                let userId = await getUserId(res, databaseConnection, email);

                passwordReset = {
                    code: uuidv4(),
                    dateOfCreation: dateISOToMySQL(Date.now()),
                    dateOfExpiration: dateISOToMySQL((Date.now() + 10 * 60000)),
                    userId: userId
                }

                let queryInsertStatement = "INSERT INTO passwordreset SET ?";
                await databaseConnection.query(queryInsertStatement, passwordReset);

                sendPasswordResetEmail(email, passwordReset.code);

                databaseConnection.release();

                res.status(201).json({ message: "Check your email" });

            } catch (e) {
                console.log(e);
                return res.status(500).json({ error: "Server error" })
            }
        });

    apiRouter.route("/:email")
        .put(async function (req, res) {
            try {
                let email = req.params.email;
                let code = req.body.code;

                let hash = crypto.pbkdf2Sync(req.body.password, config.salt, 1000, 64, "sha512");

                const user = {
                    password: hash.toString("hex")
                };

                let databaseConnection = await connectionPool.getConnection();

                let doesUserExists = await checkIfUserExists(res, databaseConnection, email);

                if (!doesUserExists) {
                    return res.status(404).json({
                        status: 404,
                        message: "No user found with the email : " + email
                    });
                }

                let ifValid = await checkIfValid(res, databaseConnection, code);

                if (!ifValid) {
                    return res.status(403).json({
                        status: 403,
                        message: "Code not valid"
                    });
                }

                let userId = await getUserId(res, databaseConnection, email);

                let queryUpdateStatement =
                    "UPDATE user SET ? " +
                    "WHERE user.id = ?;";

                await databaseConnection.query(queryUpdateStatement, [user, userId]);

                let queryDeleteStatement =
                    "DELETE FROM passwordreset " +
                    "WHERE passwordreset.code = ?;";

                await databaseConnection.query(queryDeleteStatement, code);

                databaseConnection.release();

                res.status(200).json({ message: "Your password has been changed" });

            } catch (e) {
                console.log(e);
                return res.status(500).json({ error: "Server error" })
            }
        });

    return apiRouter;
};