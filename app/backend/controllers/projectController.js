// controllers/projectController.js
const projectService = require('../services/projectService');
const projectModel = require('../models/projectModel');

async function getOrganizedProjects(req, res) {
    try {
        const projectCodes = req.query.codes;
        const startDate = req.query.startDate || '2014-12-01';
        const endDate = req.query.endDate || '2030-12-31';
        
        if (!projectCodes) {
            return res.status(400).json({ 
                error: 'Les codes projets sont requis. Veuillez les fournir dans le paramètre "codes"',
                example: "44SA18002,50FC24001,30DE15005"
            });
        }

        // Clean up the project codes
        const cleanedCodes = projectCodes
            .split(',')
            .map(code => code.trim())
            .filter(code => code)
            .join(',');

        console.log('Fetching projects with dates:', { 
            cleanedCodes, 
            startDate, 
            endDate,
            startDateType: typeof startDate,
            endDateType: typeof endDate
        });

        const organizedProjects = await projectService.organizeProjects(
            cleanedCodes,
            startDate,
            endDate
        );

        res.status(200).json(organizedProjects);
    } catch (error) {
        console.error('Erreur dans getOrganizedProjects:', error);
        res.status(500).json({ error: error.message });
    }
}

async function getProjects(req, res) {
    try {
        const projectCodes = req.query.projectCodes;
        const startDate = req.query.startDate;
        const endDate = req.query.endDate;

        if (!projectCodes) {
            return res.status(400).json({ error: 'Project codes are required' });
        }

        console.log('Fetching projects with dates:', { projectCodes, startDate, endDate });
        const data = await projectModel.getProjectsData(projectCodes, startDate, endDate);
        
        res.json(data);
    } catch (error) {
        console.error('Error in getProjects controller:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    getOrganizedProjects,
    getProjects
};
