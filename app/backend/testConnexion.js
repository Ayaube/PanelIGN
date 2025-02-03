const sql = require('mssql');
const config = require('./config'); // Chargez votre config

// Connexion à la base de données
sql.connect(config).then(() => {
    console.log('Connexion réussie à SQL Server');

    // Exécution de la requête SQL pour compter les lignes dans la table Projets
    return sql.query`SELECT COUNT(*) AS ProjectCount FROM Projets`;
}).then(result => {
    // Afficher le résultat de la requête
    console.log(`Nombre de projets dans la base de données : ${result.recordset[0].ProjectCount}`);
}).catch(err => {
    console.error('Erreur de connexion ou de requête SQL :', err);
});
