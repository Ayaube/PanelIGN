// app.js (backend)
const express = require('express');
const app = express();
const projectRoutes = require('./routes/projectRoutes');
const cors = require('cors');
const path = require('path');

console.log(" Chargement app.js (backend) ")

// Permettre les requêtes CORS
app.use(cors());

// JSON parser
app.use(express.json());

// Routes API
app.use('/api', projectRoutes);

// Servir les fichiers statiques du frontend
app.use(express.static(path.join(__dirname, '../frontend/public')));

// Redirection pour toutes les autres routes vers index.html (SPA)
app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend/public', 'index.html'));
});

// Configurer le port et démarrer le serveur
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Serveur en cours d'exécution sur le port ${port}`);
});
