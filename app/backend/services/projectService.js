// services/projectService.js
const projectModel = require('../models/projectModel');

async function organizeProjects(projectCodes, startDate, endDate) {
    console.log('Service receiving dates:', { projectCodes, startDate, endDate });
    
    // Appel du modèle avec les codes des projets et les dates
    const projects = await projectModel.getProjectsData(projectCodes, startDate, endDate);

    const tree = {};

    // Organiser les projets en arborescence
    projects.forEach(item => {
        const niveau1 = item.Projet;  // Niveau 1 - Projet racine
        const niveau2 = item.EOTP.includes('.') ? item.EOTP.split('.').slice(0, 2).join('.') : null;  // Niveau 2 - Sous-projet
        const niveau3 = item.Niveau_EOTP === 3 ? item.EOTP : null;  // Niveau 3 - Sous-sous-projet

        // Si le projet de niveau 1 n'existe pas, on l'ajoute avec des details
        if (!tree[niveau1]) {
            tree[niveau1] = {
                description: item.Description_Projet,
                details: {},
                eotp: {}// Contiendra les niveaux 2 et 3
            };
        }

        // Gestion des sous-projets de Niveau 2 et Niveau 3
        if (niveau3) {
            if (!tree[niveau1].eotp[niveau2]) {
                tree[niveau1].eotp[niveau2] = {
                    description: "Sous-projet niveau 2 inconnu",
                    niveau: 2,
                    statut: "Inconnu",
                    sousProjets: {},
                    details: {}
                };
            }

            if (!tree[niveau1].eotp[niveau2].sousProjets[niveau3]) {
                tree[niveau1].eotp[niveau2].sousProjets[niveau3] = {
                    description: item.Description_EOTP,
                    niveau: 3,
                    statut: item.Statut_Projet || "Inconnu",
                    details: {}
                };
            }

            const dateKey = new Date(item.Date).toISOString().split('T')[0];
            tree[niveau1].eotp[niveau2].sousProjets[niveau3].details[dateKey] = item;

            if (tree[niveau1].eotp[niveau2].sousProjets[niveau3].statut === "Inconnu" && item.Statut_Projet) {
                tree[niveau1].eotp[niveau2].sousProjets[niveau3].statut = item.Statut_Projet;
            }

        } else if (niveau2) {
            if (!tree[niveau1].eotp[niveau2]) {
                tree[niveau1].eotp[niveau2] = {
                    description: "Sous-projet niveau 2 inconnu",
                    niveau: 2,
                    statut: "Inconnu",
                    sousProjets: {},
                    details: {}
                };
            }

            const dateKey = new Date(item.Date).toISOString().split('T')[0];
            tree[niveau1].eotp[niveau2].details[dateKey] = item;

            if (tree[niveau1].eotp[niveau2].description === "Sous-projet niveau 2 inconnu" && item.Description_EOTP) {
                tree[niveau1].eotp[niveau2].description = item.Description_EOTP;
            }
            if (tree[niveau1].eotp[niveau2].statut === "Inconnu" && item.Statut_Projet) {
                tree[niveau1].eotp[niveau2].statut = item.Statut_Projet;
            }

        } else {
            const dateKey = new Date(item.Date).toISOString().split('T')[0];
            tree[niveau1].details[dateKey] = item;
        }
    });

    function sumDetails(details) {
        const sum = {};

        for (const dateKey in details) {
            const itemDetails = details[dateKey];
            for (const key in itemDetails) {
                if (
                    !['Projet', 'Description_Projet', 'EOTP', 'Description_EOTP', 'Niveau_EOTP', 'Statut_Projet', 'Date'].includes(key) &&
                    typeof itemDetails[key] === 'number'
                ) {
                    // Multiplier chaque valeur par 100 pour éviter les erreurs de flottants
                    sum[key] = (sum[key] || 0) + Math.round(itemDetails[key] * 100);
                }
            }
        }

        // Diviser chaque total par 100 pour retrouver les valeurs d'origine avec arrondi
        for (const key in sum) {
            sum[key] = sum[key] / 100; // Les valeurs sont maintenant arrondies à deux décimales
        }

        return sum;
    }





    // Calculer la somme des détails pour chaque niveau 1 à partir des niveaux 2 et 3
    for (const niveau1 in tree) {
        const totalDetails = {};

        // Additionner les détails des niveaux 2 et 3
        for (const niveau2 in tree[niveau1].eotp) {
            const niveau2DetailsSum = sumDetails(tree[niveau1].eotp[niveau2].details);
            for (const niveau3 in tree[niveau1].eotp[niveau2].sousProjets) {
                const niveau3DetailsSum = sumDetails(tree[niveau1].eotp[niveau2].sousProjets[niveau3].details);

                // Additionner les résultats des niveaux 3 aux détails de niveau 2
                for (const key in niveau3DetailsSum) {
                    niveau2DetailsSum[key] = (niveau2DetailsSum[key] || 0) + niveau3DetailsSum[key];
                }
            }

            // Ajouter les résultats des niveaux 2 aux détails du niveau 1
            for (const key in niveau2DetailsSum) {
                totalDetails[key] = (totalDetails[key] || 0) + niveau2DetailsSum[key];
            }
        }

        // Ajouter les détails sommés au niveau 1
        tree[niveau1].details = totalDetails;
    }

    console.log("Données organisées en arborescence : ", JSON.stringify(tree, null, 2)); // Affiche la structure de l'arborescence pour vérification
    return tree;
}

module.exports = {
    organizeProjects
};
