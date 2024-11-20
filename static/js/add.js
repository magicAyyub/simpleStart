const processButton = document.getElementById('processButton');
const loader = document.getElementById('loader');
const resultSection = document.getElementById('resultSection');
const downloadCSV = document.getElementById('downloadCSV');
const loadData = document.getElementById('loadData');
const txtFileInput = document.getElementById('txtFile');
const submitButton = document.getElementById('processButton');
const alertCloseButtons = document.querySelectorAll('.closeAlert');
 
processButton.addEventListener('click', async () => {
    const file = txtFileInput.files[0];
    if (!file) {
        showError("Veuillez sélectionner un fichier texte (.txt).");
        return;
    }
 
    // Show loader while processing
    loader.classList.remove('hidden');
 
    // Create form data to send file
    const formData = new FormData();
    formData.append('file', file);
 
    // Send file to server for processing
    const response = await fetch('/process_file', {
        method: 'POST',
        body: formData
    });
 
    // Hide loader and show result section if successful
    loader.classList.add('hidden');
    if (response.ok) {
        resultSection.classList.remove('hidden');
    } else {
        showError("Erreur de traitement du fichier.");
    }
});
 
// Download the processed CSV
downloadCSV.addEventListener('click', () => {
    window.location.href = '/download_csv';
});
 
loadData.addEventListener('click', async () => {
    const tableName = prompt('Quel est le nom de table à charger ? (Elle Sera crée si elle n\'existe pas.', 'data');
    if (!tableName) {
        showError("Le nom de la table est obligatoire.");
        return;
    }
 
    // Show loader during data loading
    loader.classList.remove('hidden');
    resultSection.classList.add('hidden');
 
    // Prepare the form data
    const formData = new FormData();
    formData.append('table_name', tableName);
 
    try {
        // Trigger data load in the backend
        const response = await fetch('/load_data', {
            method: 'POST',
            body: formData,
        });
 
        // Hide loader when done and show success or error message
        loader.classList.add('hidden');
        if (response.ok) {
            alert("Donnée chargées avec succès dans la base de donnée.");
        } else {
            const error = await response.json();
            showError(`Une erreur est survenue, veuillez réessayer plus tard.`);
            console.error(`Error loading data into the database: ${error.error}`)     
        }
    } catch (error) {
        loader.classList.add('hidden');
        showError(`Une erreur est survenue, veuillez réessayer plus tard.`);
        console.error(`Unexpected error: ${error.message}`);
    }
});


// Drag-and-Drop Functionality
const csvFileInput = document.getElementById('txtFile');
const selectedFileName = document.getElementById('selectedFileName');
const statusMessage = document.getElementById('statusMessage');


csvFileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        selectedFileName.textContent = `Fichier sélectionné : ${file.name}`;
        updateSubmitButtonState();
    }
});

function updateSubmitButtonState() {
    submitButton.style.cursor = submitButton.disabled ? 'not-allowed' : 'pointer';
}

function showError(message) {
    alertMessage.textContent = message;
    alertMessage.parentElement.classList.remove('hidden');
}

alertCloseButtons.forEach(button => {
    button.addEventListener('click', () => {
        alertMessage.parentElement.classList.add('hidden');
    });
});

const dropZone = document.querySelector('label[for="txtFile"]');
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