console.log("Chargement app.js (frontend)");

// Fonction pour récupérer les projets et charger l'arborescence
async function loadProjectTree() {
    try {
        const response = await fetch('/api/projects');
        const data = await response.json();
        currentProjectData = { data: data, level: 1 }; // Store the initial data

        const projectTree = document.getElementById('project-tree');
        projectTree.innerHTML = ''; // Vider l'arborescence

        // Affichage des projets par niveau
        for (const niveau1 in data) {
            const niveau1Item = document.createElement('li');
            niveau1Item.textContent = `${niveau1} - ${data[niveau1].description}`;
            niveau1Item.className = 'niveau1';
            niveau1Item.onclick = (e) => {
                e.stopPropagation(); // Empêcher la propagation vers les niveaux supérieurs
                // Afficher les totaux du niveau 1
                updateProjectPath([{
                    code: niveau1,
                    description: data[niveau1].description
                }], data);
                displayFinancialData([data[niveau1]], 1);
            };

            const niveau2List = document.createElement('ul');

            for (const niveau2 in data[niveau1].eotp) {
                const niveau2Item = document.createElement('li');
                niveau2Item.textContent = `${niveau2} - ${data[niveau1].eotp[niveau2].description}`;
                niveau2Item.className = 'niveau2';
                niveau2Item.onclick = (e) => {
                    e.stopPropagation();
                    updateProjectPath([
                        {
                            code: niveau1,
                            description: data[niveau1].description
                        },
                        {
                            code: niveau2,
                            description: data[niveau1].eotp[niveau2].description
                        }
                    ], data);
                    displayFinancialData([data[niveau1].eotp[niveau2]], 2);
                };

                const niveau3List = document.createElement('ul');

                for (const niveau3 in data[niveau1].eotp[niveau2].sousProjets) {
                    const niveau3Item = document.createElement('li');
                    niveau3Item.textContent = `${niveau3} - ${data[niveau1].eotp[niveau2].sousProjets[niveau3].description}`;
                    niveau3Item.className = 'niveau3';
                    niveau3Item.onclick = (e) => {
                        e.stopPropagation();
                        updateProjectPath([
                            {
                                code: niveau1,
                                description: data[niveau1].description
                            },
                            {
                                code: niveau2,
                                description: data[niveau1].eotp[niveau2].description
                            },
                            {
                                code: niveau3,
                                description: data[niveau1].eotp[niveau2].sousProjets[niveau3].description
                            }
                        ], data);
                        const niveau3Details = Object.values(data[niveau1].eotp[niveau2].sousProjets[niveau3].details || {});
                        displayFinancialData(niveau3Details, 3);
                    };

                    niveau3List.appendChild(niveau3Item);
                }
                niveau2Item.appendChild(niveau3List);
                niveau2List.appendChild(niveau2Item);
            }
            niveau1Item.appendChild(niveau2List);
            projectTree.appendChild(niveau1Item);
        }
    } catch (error) {
        console.error("Erreur lors du chargement de l'arborescence :", error);
    }
}

let currentDateFilter = {
    startDate: null,
    endDate: null
};

function initializeDateFilter() {
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    const applyButton = document.getElementById('apply-date-filter');

    // Set default date range
    startDateInput.value = '2014-01-01';
    endDateInput.value = '2030-12-31';

    // Set min and max dates
    startDateInput.min = '2014-01-01';
    endDateInput.max = '2030-12-31';

    // Initialize current filter with default values
    currentDateFilter.startDate = '2014-01-01';
    currentDateFilter.endDate = '2030-12-31';

    // Start date change handler
    startDateInput.addEventListener('change', (e) => {
        endDateInput.min = e.target.value; // Set min date for end date
        if (endDateInput.value && endDateInput.value < e.target.value) {
            endDateInput.value = e.target.value;
        }
    });

    // End date change handler
    endDateInput.addEventListener('change', (e) => {
        startDateInput.max = e.target.value; // Set max date for start date
        if (startDateInput.value && startDateInput.value > e.target.value) {
            startDateInput.value = e.target.value;
        }
    });

    // Apply filter button handler
    applyButton.addEventListener('click', async () => {
        const startDate = document.getElementById('start-date').value;
        const endDate = document.getElementById('end-date').value;
        
        console.log('Applying date filter:', { startDate, endDate });
        
        // Store the dates in the global state
        currentDateFilter.startDate = startDate;
        currentDateFilter.endDate = endDate;
        
        // Clear existing data
        const projectTree = document.getElementById('project-tree');
        projectTree.innerHTML = '';
        
        // Fetch fresh data with the new dates
        await searchProjects();
    });
}

function filterDataByDate(data, level) {
    console.log("Filtering data for level:", level);
    console.log("Date range:", currentDateFilter.startDate, "to", currentDateFilter.endDate);

    if (!data || data.length === 0) return data;

    const startDate = currentDateFilter.startDate ? new Date(currentDateFilter.startDate) : null;
    const endDate = currentDateFilter.endDate ? new Date(currentDateFilter.endDate) : null;

    // For level 3, filter directly
    if (level === 3) {
        const filtered = data.filter(item => {
            if (!item || !item.Date) return false;
            const itemDate = new Date(item.Date);
            const isInRange = (!startDate || itemDate >= startDate) && 
                            (!endDate || itemDate <= endDate);
            if (!isInRange) {
                console.log("Level 3 - Excluding record with date:", item.Date);
            } else {
                console.log("Level 3 - Including record with date:", item.Date);
            }
            return isInRange;
        });
        return filtered;
    }

    // For levels 1 and 2, recalculate based on filtered level 3 data
    const filteredData = JSON.parse(JSON.stringify(data));
    
    filteredData.forEach(item => {
        const level3Data = getAllLevel3Data(item);
        console.log(`Found ${level3Data.length} level 3 records`);
        
        const filteredLevel3Data = level3Data.filter(record => {
            if (!record || !record.Date) return false;
            const recordDate = new Date(record.Date);
            const isInRange = (!startDate || recordDate >= startDate) && 
                            (!endDate || recordDate <= endDate);
            if (!isInRange) {
                console.log("Excluding record:", {
                    date: record.Date,
                    COC_Impute: record.COC_Impute
                });
            } else {
                console.log("Including record:", {
                    date: record.Date,
                    COC_Impute: record.COC_Impute
                });
            }
            return isInRange;
        });

        // Reset and recalculate details
        if (level === 1 || level === 2) {
            console.log("Before reset:", item.details);
            resetDetails(item.details);
            console.log("After reset:", item.details);
            console.log("Calculating sums from", filteredLevel3Data.length, "records");
            sumUpFilteredData(item.details, filteredLevel3Data);
            console.log("After sum:", item.details);
        }
    });

    return filteredData;
}

function getAllLevel3Data(item) {
    const level3Data = [];
    
    // For level 1 data structure
    if (item.eotp) {
        // Iterate through niveau2
        Object.values(item.eotp).forEach(niveau2 => {
            if (niveau2.sousProjets) {
                // Iterate through niveau3
                Object.values(niveau2.sousProjets).forEach(niveau3 => {
                    if (niveau3.details) {
                        // Add all details from niveau3
                        Object.values(niveau3.details).forEach(detail => {
                            if (detail.Date) {  // Only add if it has a Date field
                                level3Data.push(detail);
                            }
                        });
                    }
                });
            }
            // Also check niveau2 details
            if (niveau2.details) {
                Object.values(niveau2.details).forEach(detail => {
                    if (detail.Date) {
                        level3Data.push(detail);
                    }
                });
            }
        });
    }
    
    // For level 2 data structure
    if (item.sousProjets) {
        Object.values(item.sousProjets).forEach(niveau3 => {
            if (niveau3.details) {
                Object.values(niveau3.details).forEach(detail => {
                    if (detail.Date) {
                        level3Data.push(detail);
                    }
                });
            }
        });
    }

    // Also check direct details
    if (item.details && typeof item.details === 'object') {
        Object.values(item.details).forEach(detail => {
            if (detail && detail.Date) {
                level3Data.push(detail);
            }
        });
    }

    console.log("Level 3 data found:", level3Data);
    return level3Data;
}

function resetDetails(details) {
    if (!details) return;
    Object.keys(details).forEach(key => {
        if (typeof details[key] === 'number') {
            details[key] = 0;
        }
    });
}

function sumUpFilteredData(details, filteredData) {
    if (!details || !filteredData) return;
    
    // Initialize a tracking object for sums
    const sums = {};
    Object.keys(details).forEach(key => {
        if (typeof details[key] === 'number') {
            sums[key] = 0;
        }
    });
    
    // Track each contribution
    filteredData.forEach(record => {
        console.log("Processing record from date:", record.Date);
        Object.keys(record).forEach(key => {
            if (typeof record[key] === 'number' && key in details) {
                sums[key] += record[key];
                console.log(`Adding to ${key}: ${record[key]} (Current sum: ${sums[key]})`);
            }
        });
    });

    // Apply the sums to details
    Object.keys(sums).forEach(key => {
        details[key] = sums[key];
        console.log(`Final sum for ${key}: ${sums[key]}`);
    });
}

function getInitialFinancialData(data) {
    const projectDetails = [];
    for (const niveau1 in data) {
        if (data[niveau1].details) {
            projectDetails.push(data[niveau1].details);
        }
    }
    return projectDetails;
}

function displayFinancialData(data, level) {
    currentProjectData = { data: data, level: level }; // Update current project data
    
    const filteredDetails = filterDataByDate(data, level);
    console.log(`Displaying financial data for level ${level}`);
    console.log("Filtered details:", filteredDetails);
    
    const contentDiv = document.getElementById('financial-content');
    if (!contentDiv) {
        console.error("Content div not found");
        return;
    }
    
    contentDiv.innerHTML = '';
    
    const treeView = document.createElement('div');
    treeView.className = 'financial-treeview';

    // Add header for columns
    const header = document.createElement('div');
    header.className = 'tree-header';
    header.innerHTML = `
        <div class="node-content">
            <div class="label-container">
                <span class="header-label">Catégorie</span>
            </div>
            <div class="value-container">
                <div class="value">Prévu</div>
                <div class="value">Reprévu</div>
                <div class="value">Imputé</div>
            </div>
        </div>
    `;
    treeView.appendChild(header);

    try {
        // Get the financial data based on the data structure
        const financialData = filteredDetails[0] && 'details' in filteredDetails[0] 
            ? filteredDetails[0].details 
            : filteredDetails[0];

        if (!financialData) {
            console.error("No financial data available");
            return;
        }

        // Structure the data into a tree
        const treeData = {
            'Heures': {
                prevu: financialData.Heures_Prevues,
                reprevu: financialData.Heures_Reprevues,
                impute: financialData.Heures_Imputees
            },
            'COA': {
                prevu: financialData.COA_Prevu,
                reprevu: financialData.COA_Reprevu,
                impute: financialData.COA_Impute,
                children: {
                    'COA Personnel': {
                        prevu: financialData.COA_Personnel_Prevu,
                        reprevu: financialData.COA_Personnel_Reprevu,
                        impute: financialData.COA_Personnel_Impute
                    },
                    'COA Matériel': {
                        prevu: financialData.COA_Materiel_Prevu,
                        reprevu: financialData.COA_Materiel_Reprevu,
                        impute: financialData.COA_Materiel_Impute
                    },
                    'COA Production': {
                        prevu: financialData.COA_Production_Prevu,
                        reprevu: financialData.COA_Production_Reprevu,
                        impute: financialData.COA_Production_Impute
                    },
                    'COA Hors RH': {
                        prevu: financialData.COA_Hors_RH_Prevu,
                        reprevu: financialData.COA_Hors_RH_Reprevu,
                        impute: financialData.COA_Hors_RH_Impute
                    }
                }
            },
            'CAA': {
                prevu: financialData.CAA_Prevu,
                reprevu: financialData.CAA_Reprevu,
                impute: financialData.CAA_Impute
            },
            'CCOA': {
                prevu: financialData.CCOA_Prevu,
                reprevu: financialData.CCOA_Reprevu,
                impute: financialData.CCOA_Impute
            },
            'FDV': {
                prevu: financialData.FDV_Prevu,
                reprevu: financialData.FDV_Reprevu,
                impute: financialData.FDV_Impute
            },
            'FG': {
                prevu: financialData.FG_Prevu,
                reprevu: financialData.FG_Reprevu,
                impute: financialData.FG_Impute
            },
            'COC': {
                prevu: financialData.COC_Prevu,
                reprevu: financialData.COC_Reprevu,
                impute: financialData.COC_Impute,
                children: {
                    'COC Interne': {
                        prevu: financialData.COC_Interne_Prevu,
                        reprevu: financialData.COC_Interne_Reprevu,
                        impute: financialData.COC_Interne_Impute
                    },
                    'COC Externe': {
                        prevu: financialData.COC_Externe_Prevu,
                        reprevu: financialData.COC_Externe_Reprevu,
                        impute: financialData.COC_Externe_Impute
                    },
                    'COC Autre': {
                        prevu: financialData.COC_Autre_Prevu,
                        reprevu: financialData.COC_Autre_Reprevu,
                        impute: financialData.COC_Autre_Impute
                    }
                }
            }
        };

        function formatNumber(value) {
            return value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }

        function createTreeNode(key, value, level = 0) {
            const node = document.createElement('div');
            node.className = 'tree-node';
            
            const content = document.createElement('div');
            content.className = 'node-content';
            
            const labelContainer = document.createElement('div');
            labelContainer.className = 'label-container';

            function isExceeded(impute, prevu, reprevu) {
                if (prevu === 0 && reprevu === 0) {
                    return false;
                }
                if (reprevu !== 0) {
                    return impute > reprevu;
                }
                return impute > prevu;
            }
            
            if (value.children) {
                const toggle = document.createElement('span');
                toggle.className = 'toggle';
                toggle.textContent = '▶';
                labelContainer.appendChild(toggle);

                const label = document.createElement('span');
                label.className = 'label parent';
                label.textContent = key;
                labelContainer.appendChild(label);
                
                content.appendChild(labelContainer);

                const values = document.createElement('div');
                values.className = 'value-container';
                
                const prevuValue = document.createElement('div');
                prevuValue.className = 'value';
                prevuValue.textContent = formatNumber(value.prevu || 0);
                
                const reprevuValue = document.createElement('div');
                reprevuValue.className = 'value';
                reprevuValue.textContent = formatNumber(value.reprevu || 0);
                
                const imputeValue = document.createElement('div');
                imputeValue.className = 'value';
                if (isExceeded(value.impute || 0, value.prevu || 0, value.reprevu || 0)) {
                    imputeValue.classList.add('exceeded');
                }
                imputeValue.textContent = formatNumber(value.impute || 0);
                
                values.appendChild(prevuValue);
                values.appendChild(reprevuValue);
                values.appendChild(imputeValue);
                
                content.appendChild(values);
                node.appendChild(content);
                
                const childrenContainer = document.createElement('div');
                childrenContainer.className = 'children';
                childrenContainer.style.display = 'none';
                
                for (const [childKey, childValue] of Object.entries(value.children)) {
                    childrenContainer.appendChild(createTreeNode(childKey, childValue, level + 1));
                }
                
                node.appendChild(childrenContainer);
                
                toggle.onclick = () => {
                    childrenContainer.style.display = childrenContainer.style.display === 'none' ? 'block' : 'none';
                    toggle.textContent = childrenContainer.style.display === 'none' ? '▶' : '▼';
                };
            } else {
                const label = document.createElement('span');
                label.className = 'label' + (level === 0 ? ' parent' : '');
                label.textContent = key;
                labelContainer.appendChild(label);
                
                content.appendChild(labelContainer);

                const values = document.createElement('div');
                values.className = 'value-container';
                
                const prevuValue = document.createElement('div');
                prevuValue.className = 'value';
                prevuValue.textContent = formatNumber(value.prevu || 0);
                
                const reprevuValue = document.createElement('div');
                reprevuValue.className = 'value';
                reprevuValue.textContent = formatNumber(value.reprevu || 0);
                
                const imputeValue = document.createElement('div');
                imputeValue.className = 'value';
                if (isExceeded(value.impute || 0, value.prevu || 0, value.reprevu || 0)) {
                    imputeValue.classList.add('exceeded');
                }
                imputeValue.textContent = formatNumber(value.impute || 0);
                
                values.appendChild(prevuValue);
                values.appendChild(reprevuValue);
                values.appendChild(imputeValue);
                
                content.appendChild(values);
                node.appendChild(content);
            }
            
            return node;
        }
        
        for (const [key, value] of Object.entries(treeData)) {
            const node = createTreeNode(key, value);
            treeView.appendChild(node);
        }
        
        contentDiv.appendChild(treeView);
    } catch (error) {
        console.error("Error displaying financial data:", error);
        contentDiv.innerHTML = `<div class="error">Erreur lors de l'affichage des données: ${error.message}</div>`;
    }
}

let currentProjectData = null; // Store the current project data globally

function updateProjectPath(path, projectData) {
    const pathDiv = document.getElementById('project-path');
    
    if (path && path.length > 0) {
        pathDiv.innerHTML = path.map((item, index) => 
            `<span data-level="${index + 1}" data-code="${item.code}" data-parent="${index > 0 ? path[index-1].code : ''}">${item.code} - ${item.description}</span>`
        ).join('');
        pathDiv.classList.add('visible');
        
        // Add click handlers to each path item
        const spans = pathDiv.getElementsByTagName('span');
        Array.from(spans).forEach(span => {
            span.addEventListener('click', handlePathClick);
        });
    } else {
        pathDiv.innerHTML = '';
        pathDiv.classList.remove('visible');
    }
}

function handlePathClick(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const level = parseInt(event.target.getAttribute('data-level'));
    const code = event.target.getAttribute('data-code');
    const parentCode = event.target.getAttribute('data-parent');
    
    if (!currentProjectData || !currentProjectData.data) {
        console.error('No project data available');
        return;
    }
    
    const data = currentProjectData.data;
    
    switch(level) {
        case 1:
            // Click on niveau1
            if (data[code]) {
                updateProjectPath([{
                    code: code,
                    description: data[code].description
                }], data);
                displayFinancialData([data[code]], 1);
            }
            break;
            
        case 2:
            // Click on niveau2
            if (data[parentCode] && data[parentCode].eotp && data[parentCode].eotp[code]) {
                const niveau2Data = data[parentCode].eotp[code];
                updateProjectPath([
                    {
                        code: parentCode,
                        description: data[parentCode].description
                    },
                    {
                        code: code,
                        description: niveau2Data.description
                    }
                ], data);
                displayFinancialData([niveau2Data], 2);
            }
            break;

        case 3:
            // Click on niveau3
            const [niveau1Code, niveau2Code] = code.split('.').slice(0, 2);
            const niveau1 = data[niveau1Code];
            if (niveau1 && niveau1.eotp[niveau2Code] && 
                niveau1.eotp[niveau2Code].sousProjets && 
                niveau1.eotp[niveau2Code].sousProjets[code]) {
                const niveau3Data = niveau1.eotp[niveau2Code].sousProjets[code];
                updateProjectPath([
                    {
                        code: niveau1Code,
                        description: niveau1.description
                    },
                    {
                        code: niveau2Code,
                        description: niveau1.eotp[niveau2Code].description
                    },
                    {
                        code: code,
                        description: niveau3Data.description
                    }
                ], data);
                const niveau3Details = Object.values(niveau3Data.details || {});
                displayFinancialData(niveau3Details, 3);
            }
            break;
    }
}

function updateProjectCounter(foundProjects, totalProjects) {
    const counter = document.getElementById('project-counter');
    counter.textContent = `${foundProjects} projets sur ${totalProjects} entrés`;
}

// Fonction pour gérer la recherche des projets
async function searchProjects() {
    try {
        const startDate = document.getElementById('start-date').value || '2014-12-01';
        const endDate = document.getElementById('end-date').value || '2030-12-31';
        
        // Build the query string with project codes and dates
        const projectCodesParam = document.getElementById('project-search').value.trim().split(/[,\s]+/).filter(code => code.length > 0).join(',');
        const queryParams = new URLSearchParams({
            codes: projectCodesParam,
            startDate: startDate,
            endDate: endDate
        });

        console.log('Fetching data with params:', Object.fromEntries(queryParams));
        
        const response = await fetch(`/api/projects?${queryParams.toString()}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        currentProjectData = { data: data, level: 1 }; // Store the initial data
        processAndDisplayData(data);
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('project-tree').innerHTML = `<div class="error">Erreur: ${error.message}</div>`;
    }
}

function processAndDisplayData(data) {
    const foundProjects = Object.keys(data).length;
    updateProjectCounter(foundProjects, document.getElementById('project-search').value.trim().split(/[,\s]+/).filter(code => code.length > 0).length);
    
    // Store the data globally for path navigation
    currentProjectData = data;
    
    // Display tree structure
    for (const niveau1 in data) {
        const niveau1Item = document.createElement('li');
        niveau1Item.textContent = `${niveau1} - ${data[niveau1].description}`;
        niveau1Item.className = 'niveau1';
        niveau1Item.onclick = (e) => {
            e.stopPropagation();
            if (data[niveau1].details) {
                updateProjectPath([{
                    code: niveau1,
                    description: data[niveau1].description
                }], data);
                displayFinancialData([data[niveau1].details], 1);
            }
        };

        const niveau2List = document.createElement('ul');
        for (const niveau2 in data[niveau1].eotp) {
            const niveau2Item = document.createElement('li');
            niveau2Item.textContent = `${niveau2} - ${data[niveau1].eotp[niveau2].description}`;
            niveau2Item.className = 'niveau2';
            niveau2Item.onclick = (e) => {
                e.stopPropagation();
                const niveau2Data = data[niveau1].eotp[niveau2];
                if (niveau2Data.details) {
                    const dates = Object.keys(niveau2Data.details);
                    if (dates.length > 0) {
                        const latestDate = dates[dates.length - 1];
                        updateProjectPath([
                            {
                                code: niveau1,
                                description: data[niveau1].description
                            },
                            {
                                code: niveau2,
                                description: niveau2Data.description
                            }
                        ], data);
                        displayFinancialData([niveau2Data.details[latestDate]], 2);
                    }
                }
            };

            const niveau3List = document.createElement('ul');
            for (const niveau3 in data[niveau1].eotp[niveau2].sousProjets) {
                const niveau3Item = document.createElement('li');
                niveau3Item.textContent = `${niveau3} - ${data[niveau1].eotp[niveau2].sousProjets[niveau3].description}`;
                niveau3Item.className = 'niveau3';
                niveau3Item.onclick = (e) => {
                    e.stopPropagation();
                    const niveau3Data = data[niveau1].eotp[niveau2].sousProjets[niveau3];
                    if (niveau3Data.details) {
                        const dates = Object.keys(niveau3Data.details);
                        if (dates.length > 0) {
                            const latestDate = dates[dates.length - 1];
                            updateProjectPath([
                                {
                                    code: niveau1,
                                    description: data[niveau1].description
                                },
                                {
                                    code: niveau2,
                                    description: data[niveau1].eotp[niveau2].description
                                },
                                {
                                    code: niveau3,
                                    description: niveau3Data.description
                                }
                            ], data);
                            displayFinancialData([niveau3Data.details[latestDate]], 3);
                        }
                    }
                };
                niveau3List.appendChild(niveau3Item);
            }
            niveau2Item.appendChild(niveau3List);
            niveau2List.appendChild(niveau2Item);
        }
        niveau1Item.appendChild(niveau2List);
        document.getElementById('project-tree').appendChild(niveau1Item);
    }
    
    // Display initial financial data for level 1
    const projectDetails = [];
    for (const niveau1 in data) {
        if (data[niveau1].details) {
            projectDetails.push(data[niveau1].details);
        }
    }
    // Clear project path for initial view
    updateProjectPath([], null);
    displayFinancialData(projectDetails, 1);
}

// Fonction pour initialiser l'interface avec un message d'instruction
function initializeInterface() {
    const projectTree = document.getElementById('project-tree');
    const message = document.createElement('div');
    message.className = 'instruction-message';
    message.textContent = 'Entrez des codes projets dans la barre de recherche pour afficher les données';
    message.style.color = '#FAF3E0';
    message.style.padding = '10px';
    message.style.fontStyle = 'italic';
    projectTree.appendChild(message);

    const container = document.querySelector('.table-container');
    const title = container.querySelector('h2');
    if (title) {
        title.textContent = 'Données Financières';
    }
}

// When the document is ready
document.addEventListener('DOMContentLoaded', function() {
    initializeInterface();
    initializeDateFilter();
    
    // Add search button click handler
    document.getElementById('search-button').addEventListener('click', searchProjects);
    
    // Add enter key handler for search input
    document.getElementById('project-search').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchProjects();
        }
    });
});
