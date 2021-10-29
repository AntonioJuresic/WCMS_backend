const authenticationRouter = require("./routes/api-authentication");
const authorityRouter = require("./routes/api-authority");
const invitationRouter = require("./routes/api-invitations")

const infoRouter = require("./routes/api-info");

const postRouter = require("./routes/api-post");
const postCommentsRouter = require("./routes/api-post-comments");

const categoryRouter = require("./routes/api-category");
const categoryPostsRouter = require("./routes/api-category-posts");

const userRouter = require("./routes/api-user");
const userPostsRouter = require("./routes/api-user-posts");
const userCommentRouter = require("./routes/api-user-comments");
const userAuthorityRouter = require("./routes/api-user-authority");

const commentRouter = require("./routes/api-comments");

const userHimselfRouter = require("./routes/api-user-himself");

module.exports = (express, connectionPool) => {
    const apiRouter = express.Router();

    apiRouter.route("/")
        .get(async function (req, res) {
            res.json({ status: 200, message: "Dobro došli na naš API!" });
        });

    apiRouter.use("/authentication", authenticationRouter(express, connectionPool));
    apiRouter.use("/invitation", invitationRouter(express, connectionPool));
    apiRouter.use("/authority", authorityRouter(express, connectionPool));

    apiRouter.use("/info", infoRouter(express, connectionPool));

    apiRouter.use("/post", postRouter(express, connectionPool));
    apiRouter.use("/post-comments", postCommentsRouter(express, connectionPool));

    apiRouter.use("/category", categoryRouter(express, connectionPool));
    apiRouter.use("/category-posts", categoryPostsRouter(express, connectionPool));
    
    apiRouter.use("/user", userRouter(express, connectionPool));
    apiRouter.use("/user-posts", userPostsRouter(express, connectionPool));
    apiRouter.use("/user-comments", userCommentRouter(express, connectionPool));
    apiRouter.use("/user-authority", userAuthorityRouter(express, connectionPool));
    apiRouter.use("/user-himself", userHimselfRouter(express, connectionPool));

    apiRouter.use("/comment", commentRouter(express, connectionPool));
    
    return apiRouter;
};