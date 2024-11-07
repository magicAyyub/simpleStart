document.addEventListener("DOMContentLoaded", function () {
  const fileInput = document.getElementById("upload_file");
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

  // Drag and drop functionality
  const dropZone = document.querySelector('label[for="upload_file"]');

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
