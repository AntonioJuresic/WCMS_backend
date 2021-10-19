module.exports={

    port:  process.env.PORT || 8081,
    connectionPoolData: {
        connectionLimit : 100,
        host     : "host",
        user     : "user",
        password : "password",
        database : "database",
        debug    :  false
    },

    secret: "secret",
    salt: "salt",
    
    uploadPath: "./public/uploads/",

    auth: {
        user: "user",
        pass: "pass"
    }
}