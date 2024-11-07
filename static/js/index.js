document.addEventListener('DOMContentLoaded', function() {
    const rows = document.querySelectorAll('tbody tr');
    const totalCount = rows.length;
    const currentCountElement = document.getElementById('currentCount');
    const totalCountElement = document.getElementById('totalCount');
    const noResultsElement = document.getElementById('noResults');
    const tableBody = document.querySelector('tbody');
    const clearSearchButton = document.getElementById('clearSearch');
    const quickSearchInput = document.getElementById('quickSearch');
    const emailRegexInput = document.getElementById('emailRegex');
    const applyRegexButton = document.getElementById('applyRegex');
    const fileInput = document.getElementById('csv_file');
    const uploadForm = document.getElementById('csvUploadForm');

    // Initialize the result count
    currentCountElement.textContent = totalCount;
    totalCountElement.textContent = totalCount;

    // scroll to top button
    const scrollToTopBtn = document.getElementById('scrollToTopBtn');
    scrollToTopBtn.addEventListener('click', function() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    function updateVisibility(visibleCount) {
        if (visibleCount === 0) {
            tableBody.classList.add('hidden');
            noResultsElement.classList.remove('hidden');
        } else {
            tableBody.classList.remove('hidden');
            noResultsElement.classList.add('hidden');
        }
        currentCountElement.textContent = visibleCount;
    }

    // Quick Search functionality
    quickSearchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        let visibleCount = 0;
        
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            const isVisible = text.includes(searchTerm);
            row.style.display = isVisible ? '' : 'none';
            if (isVisible) visibleCount++;
        });

        updateVisibility(visibleCount);
    });

    // Email Regex Filter functionality
    applyRegexButton.addEventListener('click', function() {
        const regexPattern = emailRegexInput.value; 
        let visibleCount = 0;
        let emailCeilNumber = 0;

        // Find the email column number
        document.querySelectorAll('thead th').forEach((th, index) => {
            if (th.textContent.toLowerCase() === 'email') {
                emailCeilNumber = index;
                return;
            }
        });
        
        if (regexPattern) {
            const regex = new RegExp(regexPattern, 'i');
            rows.forEach(row => {
                if (!emailCeilNumber) throw new Error('Email column not found');
                const emailCell = row.querySelectorAll('td')[emailCeilNumber].textContent;
                const isVisible = regex.test(emailCell);
                row.style.display = isVisible ? '' : 'none';
                if (isVisible) visibleCount++;
            });
        } else {
            rows.forEach(row => row.style.display = '');
            visibleCount = totalCount;
        }

        updateVisibility(visibleCount);
    });

    // Enhanced CSV Upload functionality
    const fileName = document.getElementById('file-name');
    const uploadButton = document.querySelector('button[type="submit"]');

    fileInput.addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
            fileName.textContent = `File selected: ${e.target.files[0].name}`;
            uploadButton.disabled = false;
        } else {
            fileName.textContent = '';
            uploadButton.disabled = true;
        }
    });

    // Clear search functionality
    clearSearchButton.addEventListener('click', function() {
        quickSearchInput.value = '';
        emailRegexInput.value = '';
        rows.forEach(row => row.style.display = '');
        updateVisibility(totalCount);
    });

    // Drag and drop functionality
    const dropZone = document.querySelector('label[for="csv_file"]');

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });

    function highlight(e) {
        dropZone.classList.add('border-blue-500');
    }

    function unhighlight(e) {
        dropZone.classList.remove('border-blue-500');
    }

    dropZone.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        fileInput.files = files;
        if (files.length > 0) {
            fileName.textContent = `File selected: ${files[0].name}`;
            uploadButton.disabled = false;
        }
    }
});