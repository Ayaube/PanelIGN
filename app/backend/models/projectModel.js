const sql = require('mssql');
const config = require('../config/database');

class ProjectModel {
    async getProjectsData(projectCodes, startDate, endDate) {
        let pool;
        try {
            console.log("Received parameters:", { projectCodes, startDate, endDate });
            
            // Format dates properly
            const formattedStartDate = startDate ? new Date(startDate) : new Date('2014-12-01');
            const formattedEndDate = endDate ? new Date(endDate) : new Date('2030-12-31');

            console.log("Formatted dates:", {
                formattedStartDate: formattedStartDate.toISOString(),
                formattedEndDate: formattedEndDate.toISOString()
            });

            // Connect to database
            pool = await sql.connect(config);
            console.log("Connected to database successfully");

            // Execute stored procedure
            const result = await pool.request()
                .input('ProjectCodes', sql.VarChar(sql.MAX), projectCodes)
                .input('StartDate', sql.Date, formattedStartDate)
                .input('EndDate', sql.Date, formattedEndDate)
                .execute('getInfoWeb');

            console.log("Query executed successfully");
            return result.recordset;
        } catch (error) {
            console.error("Database error:", error);
            throw new Error('Erreur lors de la récupération des données projets : ' + error.message);
        } finally {
            if (pool) {
                try {
                    await pool.close();
                    console.log("Database connection closed");
                } catch (err) {
                    console.error("Error closing database connection:", err);
                }
            }
        }
    }

    processProjectData(data) {
        // TO DO: implement data processing logic
        return data;
    }
}

module.exports = {
    getProjectsData: (projectCodes, startDate, endDate) => new ProjectModel().getProjectsData(projectCodes, startDate, endDate)
};
