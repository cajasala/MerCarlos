const sql = require('mssql');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    options: {
        encrypt: true, // For Azure SQL
        trustServerCertificate: true
    }
};

let poolPromise = sql.connect(config)
    .then(pool => {
        console.log('Connected to Azure SQL' + process.env.DB_SERVER);
        return pool;
    })
    .catch(err => {
        console.log('Azure SQL : ' +  process.env.DB_SERVER);
        console.error('Database Connection Failed! Bad Config: ', err);
        throw err;
    });

module.exports = {
    sql,
    poolPromise
};
