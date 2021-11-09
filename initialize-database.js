const config = require("./config");

async function initializeDatabase() {
    try {
        var mysql = require('mysql');

        var con = mysql.createConnection({
            host: config.connectionPoolData.host,
            user: config.connectionPoolData.user,
            password: config.connectionPoolData.password,
            multipleStatements: true
        });

        var fs = require('fs');

        var DDL = fs.readFileSync(__dirname + "/SQL/DDL.sql", 'utf8');

        await con.connect(function (err) {
            if (err) throw err;
        });

        await con.query(DDL, function (err, result) {
            if (err) throw err;
            console.log("Database and tables created");
        });

        var DML = fs.readFileSync(__dirname + "/SQL/DML.sql", 'utf8');

        await con.query(DML, function (err, result) {
            if (err) throw err;
            console.log("Data inserted into database");
        });

    } catch (err) {
        console.log(err);
    }
}

initializeDatabase();