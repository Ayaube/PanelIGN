require('dotenv').config();

const config = {
    user: 'sa',
    password: 'Ignpeps2023',
    server: '100.106.160.6',
    database: 'stockage',
    port: 1433, // Essayez de spécifier le port 1433 explicitement
    options: {
        encrypt: false, // Pas de SSL
        trustServerCertificate: true // Ignorer les erreurs de certificat si nécessaire
    }
};


module.exports = config;
