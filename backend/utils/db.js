const sql = require('mssql');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};

let _poolPromise = sql.connect(config)
    .then(pool => {
        console.log('Connected to Azure SQL' + process.env.DB_SERVER);
        return pool;
    })
    .catch(err => {
        console.log('Azure SQL : ' + process.env.DB_SERVER);
        console.error('Database Connection Failed! Bad Config: ', err);
        throw err;
    });

async function getPool() {
    try {
        return await _poolPromise;
    } catch {
        _poolPromise = sql.connect(config);
        return _poolPromise;
    }
}

module.exports = {
    sql,
    getPool
};
