IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'getInfoWeb')
BEGIN
    DROP PROCEDURE getInfoWeb;
END;
GO

CREATE PROCEDURE getInfoWeb
    @ProjectCodes VARCHAR(MAX), -- Liste des codes projets séparés par des virgules
    @StartDate DATE,            -- Date de début (incluse)
    @EndDate DATE               -- Date de fin (incluse)
AS
BEGIN
    SET NOCOUNT ON;

    -- Vérification des paramètres pour éviter les erreurs
    IF @StartDate IS NULL OR @EndDate IS NULL
    BEGIN
        PRINT 'StartDate and EndDate must be provided.';
        RETURN;
    END;

    IF @StartDate > @EndDate
    BEGIN
        PRINT 'StartDate cannot be greater than EndDate.';
        RETURN;
    END;

    -- Table temporaire pour les codes des projets
    DECLARE @TempTable TABLE (ProjectCode VARCHAR(255));

    -- Remplir la table temporaire avec les codes des projets
    INSERT INTO @TempTable (ProjectCode)
    SELECT TRIM(value) 
    FROM STRING_SPLIT(@ProjectCodes, ',');

    -- Sélectionner les données pour les codes de projets spécifiés et dans la période demandée
    SELECT
        P.Projet,
        P.Description_Projet,
        E.EOTP,
        E.Description_EOTP,
        E.Niveau_EOTP,
        S.Statut_Projet,
        rq.Date,
        rq.Heures_Prevues, rq.Heures_Reprevues, rq.Heures_Imputees,
        rq.COA_Personnel_Prevu, rq.COA_Personnel_Reprevu, rq.COA_Personnel_Impute,
        rq.COA_Materiel_Prevu, rq.COA_Materiel_Reprevu, rq.COA_Materiel_Impute,
        rq.COA_Production_Prevu, rq.COA_Production_Reprevu, rq.COA_Production_Impute,
        rq.COA_Hors_RH_Prevu, rq.COA_Hors_RH_Reprevu, rq.COA_Hors_RH_Impute,
        rq.COA_ST_Impute,
        rq.COA_Prevu, rq.COA_Reprevu, rq.COA_Impute,
        rq.CAA_Prevu, rq.CAA_Reprevu, rq.CAA_Impute,
        rq.CCOA_Prevu, rq.CCOA_Reprevu, rq.CCOA_Impute,
        rq.FDV_Prevu, rq.FDV_Reprevu, rq.FDV_Impute,
        rq.FG_Prevu, rq.FG_Reprevu, rq.FG_Impute,
        rq.COC_Interne_Prevu, rq.COC_Interne_Reprevu, rq.COC_Interne_Impute,
        rq.COC_Externe_Prevu, rq.COC_Externe_Reprevu, rq.COC_Externe_Impute,
        rq.COC_Autre_Prevu, rq.COC_Autre_Reprevu, rq.COC_Autre_Impute,
        rq.COC_ST_Prevu, rq.COC_ST_Reprevu, rq.COC_ST_Impute,
        rq.COC_AvD,
        rq.COC_Prevu, rq.COC_Reprevu, rq.COC_Impute
    FROM ResultatQuotidien rq
    JOIN Projets P ON P.ID = rq.Projet_ID
    JOIN EOTP E ON E.ID = rq.EOTP_ID
    JOIN Statuts S ON S.ID = P.Statut_ID
    WHERE P.Projet IN (SELECT ProjectCode FROM @TempTable)
      AND rq.Date BETWEEN @StartDate AND @EndDate; -- Filtrer par période
END;
GO