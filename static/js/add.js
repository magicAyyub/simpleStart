const processButton = document.getElementById('processButton');
const loader = document.getElementById('loader');
const resultSection = document.getElementById('resultSection');
const downloadCSV = document.getElementById('downloadCSV');
const loadData = document.getElementById('loadData');
const txtFileInput = document.getElementById('txtFile');
const submitButton = document.getElementById('processButton');
 
processButton.addEventListener('click', async () => {
    const file = txtFileInput.files[0];
    if (!file) {
        alert("Please select a text file.");
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
        alert("Error processing file");
    }
});
 
// Download the processed CSV
downloadCSV.addEventListener('click', () => {
    window.location.href = '/download_csv';
});
 
// Load CSV data into the database
loadData.addEventListener('click', async () => {
    // Show loader during data loading
    loader.classList.remove('hidden');
    resultSection.classList.add('hidden');
 
    // Trigger data load in the backend
    const response = await fetch('/load_data', { method: 'POST' });
 
    // Hide loader when done and show success or error message
    loader.classList.add('hidden');
    if (response.ok) {
        alert("Data loaded successfully into the database.");
    } else {
        alert("Error loading data into the database.");
    }
});
// Download the processed CSV
downloadCSV.addEventListener('click', () => {
    window.location.href = '/download_csv';
});

// Load CSV data into the database
loadData.addEventListener('click', async () => {
    const response = await fetch('/load_data', { method: 'POST' });
    if (response.ok) {
        alert("Data loaded successfully into the database.");
    } else {
        alert("Error loading data into the database.");
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
        statusMessage.textContent = "";
        updateSubmitButtonState();
    }
});

function updateSubmitButtonState() {
    submitButton.style.cursor = submitButton.disabled ? 'not-allowed' : 'pointer';
}

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