const express = require("express");
const path = require("path");

const morgan = require("morgan");
const cors = require("cors");

const mysql = require("promise-mysql");

const config = require("./config");
const apiRouter = require("./api/api-router");


async function startServer() {

    try {
        const connectionPool = await mysql.createPool(config.connectionPoolData);
        const app = express();

        app.use(function (req, res, next) {
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
            res.setHeader("Access-Control-Allow-Headers", "X-Requested-With,content-type, \ Authorization");
            next();
        });
        
        app.use(cors());
        app.use(morgan("dev"));

        app.disable('etag');

        app.use(express.urlencoded({ extended: true }));
        app.use(express.json());


        app.use("/api", apiRouter(express, connectionPool));

        app.use(express.static(path.join(__dirname, "./public/front")));
        
        app.get("/public/uploads/:fileName", async (req, res) => {
            let fileName = req.params.fileName;
            res.sendFile(path.join(__dirname, config.uploadPath + fileName));
        });

        app.listen(config.port);
        console.log("Running on port http://localhost:" + config.port);
    } catch (err) {
        console.log(err);
    }
}

startServer();