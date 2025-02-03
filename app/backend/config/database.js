const config = {
    user: 'sa',
    password: 'Ignpeps2023',
    server: '100.106.160.6',
    database: 'stockage',
    port: 1433,
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
        connectTimeout: 60000,
        requestTimeout: 60000
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

module.exports = config;
