const authenticationRouter = require("./routes/api-authentication");
const invitationRouter = require("./routes/api-invitations");
const authorityRouter = require("./routes/api-authority");

const userRouter = require("./routes/api-user");
const userPasswordRouter = require("./routes/api-user-password");
const userHimselfRouter = require("./routes/api-user-himself");
const userAuthorityRouter = require("./routes/api-user-authority");

const websiteMetaRouter = require("./routes/api-website-meta");
const websiteHeaderRouter = require("./routes/api-website-header");
const websiteFooterRouter = require("./routes/api-website-footer");

const categoryRouter = require("./routes/api-category");

const postRouter = require("./routes/api-post");
const categoryPostsRouter = require("./routes/api-category-posts");
const userPostsRouter = require("./routes/api-user-posts");

const commentRouter = require("./routes/api-comments");
const userCommentRouter = require("./routes/api-user-comments");
const postCommentsRouter = require("./routes/api-post-comments");

module.exports = (express, connectionPool) => {
    const apiRouter = express.Router();

    apiRouter.route("/")
        .get(async function (req, res) {
            res.json({ status: 200, message: "Dobro došli na naš API!" });
        });

    apiRouter.use("/authentication", authenticationRouter(express, connectionPool));
    apiRouter.use("/invitation", invitationRouter(express, connectionPool));
    apiRouter.use("/authority", authorityRouter(express, connectionPool));

    apiRouter.use("/user", userRouter(express, connectionPool));
    apiRouter.use("/user-password", userPasswordRouter(express, connectionPool));
    apiRouter.use("/user-himself", userHimselfRouter(express, connectionPool));
    apiRouter.use("/user-authority", userAuthorityRouter(express, connectionPool));

    apiRouter.use("/website-meta", websiteMetaRouter(express, connectionPool));
    apiRouter.use("/website-header", websiteHeaderRouter(express, connectionPool));
    apiRouter.use("/website-footer", websiteFooterRouter(express, connectionPool));


    apiRouter.use("/category", categoryRouter(express, connectionPool));

    apiRouter.use("/post", postRouter(express, connectionPool));
    apiRouter.use("/category-posts", categoryPostsRouter(express, connectionPool));
    apiRouter.use("/user-posts", userPostsRouter(express, connectionPool));

    apiRouter.use("/comment", commentRouter(express, connectionPool));
    apiRouter.use("/post-comments", postCommentsRouter(express, connectionPool));
    apiRouter.use("/user-comments", userCommentRouter(express, connectionPool));

    return apiRouter;
};