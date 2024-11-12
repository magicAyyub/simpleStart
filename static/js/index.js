const simpleSearchBtn = document.getElementById('simpleSearch');
const csvSearchBtn = document.getElementById('csvSearch');
const regexSearchBtn = document.getElementById('regexSearch');
const simpleSearchFields = document.getElementById('simpleSearchFields');
const csvSearchFields = document.getElementById('csvSearchFields');
const regexSearchFields = document.getElementById('regexSearchFields');
const toggleMoreFieldsBtn = document.getElementById('toggleMoreFields');
const moreFields = document.getElementById('moreFields');
const csvFileInput = document.getElementById('csvFile');
const selectedFileName = document.getElementById('selectedFileName');
const submitButton = document.getElementById('submitButton');
const searchForm = document.getElementById('searchForm');
const resultsSection = document.getElementById('resultsSection');
const resultsBody = document.getElementById('resultsBody');
const searchCount = document.getElementById('searchCount');
const uploadButton = document.getElementById('uploadCSV');
const statusMessage = document.getElementById('statusMessage');
const searchButtons = [simpleSearchBtn, csvSearchBtn, regexSearchBtn];
const resultCount = document.getElementById('resultCount');


let currentSearchType = 'simple';
let searchCounter = 0;


function showSearchFields(type) {
    simpleSearchFields.classList.add('hidden');
    csvSearchFields.classList.add('hidden');
    regexSearchFields.classList.add('hidden');
    uploadButton.classList.add('hidden');
    submitButton.classList.remove('hidden');
 
    // Reset all button styles
    searchButtons.forEach(button => {
        button.classList.remove('bg-black', 'text-white');
        button.classList.add('bg-white', 'text-gray-800');
    });
 
    // Apply black background and white text to the selected button
    const selectedButton = {
        simple: simpleSearchBtn,
        csv: csvSearchBtn,
        regex: regexSearchBtn
    }[type];
    selectedButton.classList.add('bg-black', 'text-white');
    selectedButton.classList.remove('bg-white', 'text-gray-800');
 
    // Show corresponding fields
    switch(type) {
        case 'simple':
            simpleSearchFields.classList.remove('hidden');
            break;
        case 'csv':
            csvSearchFields.classList.remove('hidden');
            uploadButton.classList.remove('hidden');
            submitButton.classList.add('hidden');
            break;
        case 'regex':
            regexSearchFields.classList.remove('hidden');
            break;
    }
 
    currentSearchType = type;
    updateSubmitButtonState();
}

simpleSearchBtn.addEventListener('click', () => showSearchFields('simple'));
csvSearchBtn.addEventListener('click', () => showSearchFields('csv'));
regexSearchBtn.addEventListener('click', () => showSearchFields('regex'));

toggleMoreFieldsBtn.addEventListener('click', () => {
    moreFields.classList.toggle('hidden');
    toggleMoreFieldsBtn.innerHTML = moreFields.classList.contains('hidden') ? 
        `<i class="fas fa-chevron-down mr-2"></i> Plus de critères` : 
        `<i class="fas fa-chevron-up mr-2"></i> Moins de critères`;
});


// CSV Upload
csvFileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        selectedFileName.textContent = `Fichier sélectionné : ${file.name}`;
        statusMessage.textContent = "";
    }
});

uploadButton.addEventListener('click', async (e) => {
    const file = csvFileInput.files[0];
    if (!file) {
        statusMessage.textContent = "Please select a file before uploading.";
        return;
    }

    const formData = new FormData();
    formData.append("csv_file", file);

    try {
        statusMessage.textContent = "Uploading...";
        const response = await fetch('/fill_csv', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            const blob = await response.blob();
            const downloadUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = "filled_data.csv";
            document.body.appendChild(a);
            a.click();
            a.remove();
            statusMessage.textContent = "File processed and downloaded successfully.";
        } else {
            const errorData = await response.json();
            statusMessage.textContent = `Error: ${errorData.error}`;
        }
    } catch (error) {
        statusMessage.textContent = `Error: ${error.message}`;
    }
});

function updateSubmitButtonState() {
    submitButton.disabled = currentSearchType === 'csv' && !csvFileInput.files.length;
    submitButton.style.cursor = submitButton.disabled ? 'not-allowed' : 'pointer';
}

async function displayResults(results) {
    const resultsSection = document.getElementById('resultsSection');
    const resultsHeader = document.getElementById('resultsHeader');
    const resultsBody = document.getElementById('resultsBody');
 
    if (results.length === 0) {
        resultsSection.classList.add('hidden');
        alert("No results found");
        return;
    }
 
    // Show the results section
    resultsSection.classList.remove('hidden');
 
    // Clear previous results
    resultsHeader.innerHTML = '';
    resultsBody.innerHTML = '';
      

    // Define the desired order of columns
    const columnOrderResponse =  await fetch('static/jsons/db_columns.json');
    const columnOrder = await columnOrderResponse.json();
 
    // Generate table headers based on the column order
    const headerRow = columnOrder.map(header => 
        `<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">${header}</th>`
    ).join('');
    resultsHeader.innerHTML = `<tr>${headerRow}</tr>`;
 
    // Populate the table rows with the results in the specified order
    results.forEach(result => {
        const row = columnOrder.map(header => 
            `<td class="px-6 py-4 whitespace-nowrap">${result[header] || ''}</td>`
        ).join('');
        resultsBody.innerHTML += `<tr>${row}</tr>`;
    });
    resultCount.textContent = `${results.length} résultats`;
}


searchForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    searchCounter++;
    searchCount.textContent = `${searchCounter} recherches effectuées`;
 
    const formData = new FormData(searchForm);
    const data = Object.fromEntries(formData.entries());
 
    try {
        const response = await fetch('/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
 
        const result = await response.json();
        if (response.ok) {
            // Display the results
            displayResults(result.results);

        } else {
            console.error(result.error);
        }
    } catch (error) {
        console.error('Error:', error);
    }
});

// Drag-and-Drop Functionality
const dropZone = document.querySelector('label[for="csvFile"]');
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => dropZone.addEventListener(eventName, () => dropZone.classList.add('bg-teal-50'), false));
['dragleave', 'drop'].forEach(eventName => dropZone.addEventListener(eventName, () => dropZone.classList.remove('bg-teal-50'), false));

dropZone.addEventListener('drop', (e) => {
    const file = e.dataTransfer.files[0];
    csvFileInput.files = e.dataTransfer.files;
    if (file) {
        selectedFileName.textContent = `Fichier sélectionné : ${file.name}`;
        updateSubmitButtonState();
    }
});

showSearchFields('simple');