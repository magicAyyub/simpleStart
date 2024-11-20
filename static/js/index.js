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
const alertMessage = document.getElementById('alertMessage');
const alertCloseButtons = document.querySelectorAll('.closeAlert');
const searchButtons = [simpleSearchBtn, csvSearchBtn, regexSearchBtn];
const resultCount = document.getElementById('resultCount');
const likeSearchCheckBox = document.getElementById('like');
const cleanFormButton = document.getElementById('clean');


const resultsPerPage = 30;  // Set the limit of results per page
let searchCache = {};
let totalPageCount = 0; // To track the total number of pages
let searchCounter = 0;
let likeSearch = false;
let previousPage = 1; 
let currentPage = 1;  // Track the current page
let currentSearchType = 'simple';
let totalResult = 0;
let currentTotal = -resultsPerPage;
let isTotalChange = true;


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

likeSearchCheckBox.addEventListener('change', () => {
    likeSearch = likeSearchCheckBox.checked;
    likeSearchCheckBox.value = '1' ? likeSearch : '0';
});

toggleMoreFieldsBtn.addEventListener('click', () => {
    moreFields.classList.toggle('hidden');
    toggleMoreFieldsBtn.innerHTML = moreFields.classList.contains('hidden') ? 
        `<i class="fas fa-chevron-down mr-2"></i> Plus de critères` : 
        `<i class="fas fa-chevron-up mr-2"></i> Moins de critères`;
});

cleanFormButton.addEventListener('click', () => {
    searchForm.reset(); 
    document.querySelector('#regex').value = '';
    selectedFileName.textContent = '';
});

alertCloseButtons.forEach(button => {
    button.addEventListener('click', () => {
        alertMessage.parentElement.classList.add('hidden');
    });
});


// CSV Upload
csvFileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        selectedFileName.textContent = `Fichier sélectionné : ${file.name}`;
        statusMessage.textContent = "";
    }
});

// CSV search
uploadButton.addEventListener('click', async (e) => {
    preventDefaults(e);
    const file = csvFileInput.files[0];
    if (!file) {
        showError("Veuillez d'abord sélectionner un fichier CSV");
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
            showError('Une erreur est survenue, veuillez réessayer plus tard.');
            const errorData = await response.json();
            console.error( `Error: ${errorData.error}`)
        }
    } catch (error) {
        statusMessage.textContent = `Error: ${error.message}`;
    }
});


 
async function fetchResults(page = 1) {
    const formData = new FormData(searchForm);
    const data = Object.fromEntries(formData.entries());

 
    if (!is_empty(data)) {
        // Add pagination parameters
        data.page = page;
        data.limit = resultsPerPage;
 
        // Check if the page is cached
        if (searchCache[page]) {
            displayResults(searchCache[page], page, totalResult);
            return;
        }
 
        try {
            // Fetch results from the server
            const response = await fetch('/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
 
            const result = await response.json();
 
            if (response.ok) {
                // Cache the results for the page
                searchCache[page] = result.results;

                if (isTotalChange) {
                    totalResult = result.total_count;
                    isTotalChange = false;
                }
                totalPageCount = Math.ceil(totalResult / resultsPerPage);
 
                // Display the results
                displayResults(result.results, page, totalResult);
 
                // Update pagination controls
                updatePaginationControls(page, totalPageCount);
            } else {
                showError('Une erreur est survenue, veuillez réessayer plus tard.');
                console.error(result.error);
            }
        } catch (error) {
            showError('Une erreur est survenue, veuillez réessayer plus tard.');
            console.error('Error:', error);
        }
    } else {
        showError("Au moins un champ de recherche doit être rempli.");
    }
}
 
// Function to display results
async function displayResults(results, page, totalCount) {
    const resultsSection = document.getElementById('resultsSection');
    const resultsHeader = document.getElementById('resultsHeader');
    const resultsBody = document.getElementById('resultsBody');
    const paginationControls = document.getElementById('paginationControls');
    const currentPageDisplay = document.getElementById('currentPage');
    const resultCountDisplay = document.getElementById('resultCount');
 
    if (results.length === 0) {
        resultsSection.classList.add('hidden');
        paginationControls.classList.add('hidden');
        alert("No results found");
        return;
    }

    currentTotal = (page < currentPage) ? currentTotal - results.length : currentTotal + results.length
    
 
    // Show the results section and pagination controls
    resultsSection.classList.remove('hidden');
    paginationControls.classList.remove('hidden');
 
    // Scroll to the results section
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'end' });
 
    // Update result count display
    resultCountDisplay.textContent = `${currentTotal} sur ${totalCount} résultats`;
 
    // Set the current page display
    currentPageDisplay.textContent = `Page ${page}`;
 
    // Clear previous results
    resultsHeader.innerHTML = '';
    resultsBody.innerHTML = '';
 
    // Fetch column order
    const columnOrderResponse = await fetch('static/jsons/db_columns.json');
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
}
 
// Function to update pagination controls
function updatePaginationControls(currentPage, totalPages) {
    console.log(`${currentPage} : ${totalPages}`);
    const prevPageButton = document.getElementById('prevPage');
    const nextPageButton = document.getElementById('nextPage');
 
    // Enable or disable "Previous" button
    if (currentPage > 1) {
        prevPageButton.classList.remove('disabled');
        prevPageButton.classList.add('cursor-pointer');
    } else {
        prevPageButton.classList.add('disabled');
        prevPageButton.classList.remove('cursor-pointer');
    }
 
    // Enable or disable "Next" button
    if (currentPage < totalPages) {
        nextPageButton.classList.remove('disabled');
        nextPageButton.classList.add('cursor-pointer');
    } else {
        nextPageButton.classList.add('disabled');
        nextPageButton.classList.remove('cursor-pointer');
    }
}
 
 
function changePage(page) {
    previousPage = currentPage - 1;
    currentPage = (page < 0) ? previousPage : currentPage + page;
    searchByPage(currentPage)
}


function showError(message) {
    alertMessage.textContent = message;
    alertMessage.parentElement.classList.remove('hidden');
}

function is_empty(obj) {
    let count = 0;
    for (let key in obj) {
        if (obj[key] !== "" && obj[key] !== null && obj[key] !== undefined) {
            count++;
        }
    }
    return count == 0;
}

function updateSubmitButtonState() {
    submitButton.disabled = currentSearchType === 'csv' && !csvFileInput.files.length;
    submitButton.style.cursor = submitButton.disabled ? 'not-allowed' : 'pointer';
}
// Trigger the search on form submit
searchForm.addEventListener('submit', async (event) => {
    event.preventDefault();
 
    searchCounter++;
    searchCount.textContent = `${searchCounter} recherches effectuées`;
 
    searchCache = {}; // Clear the cache for a new search
    currentPage = 1; // Reset to the first page
    isTotalChange = true;
    searchByPage(currentPage);
});

async function searchByPage(page) {
        // Display SweetAlert loading dialog
        Swal.fire({
            title: 'Recherche en cours',
            html: 'Veuillez patienter pendant que nous récupérons les résultats...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            },
        });
    
     
        try {
            // Trigger the search operation
            await fetchResults(page);
     
            // Close SweetAlert after the search completes
            Swal.close();
     
            // Optionally scroll to results section
            const resultSection = document.getElementById('resultsSection');
            resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } catch (error) {
            // Show an error message if the search fails
            Swal.fire({
                icon: 'error',
                title: 'Erreur',
                text: 'Une erreur est survenue lors de la recherche.',
            });
        }
}

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