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

        var sqlScript = fs.readFileSync(__dirname + "/SQL/schema.sql", 'utf8');
        console.log(sqlScript);

        await con.connect(function (err) {
            if (err) throw err;

            con.query(sqlScript, function (err, result) {
                if (err) throw err;
                console.log("Table created");
            });
        });

    } catch (err) {
        console.log(err);
    }
}

initializeDatabase();