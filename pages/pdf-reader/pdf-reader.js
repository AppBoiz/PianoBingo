pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

let currentPage = 1;
let totalPages = 0;
let pdf;
let container;

function loadPdf(){
    let currentSong = getCurrentSong();
    // Ensure the pdfBase64 variable is available after the pdf-base64.js is imported
    if (typeof t2t9h8uF === 'undefined') {
        console.error('t2t9h8uF is not defined. Make sure pdf-base64.js is properly loaded.');
    } else {
        container = document.getElementById('pdf-viewer');

        // Decode the Base64 string and load the PDF as a binary string
        const byteArray = new Uint8Array(atob(currentSong.pdfUrl).split("").map(function(c) { return c.charCodeAt(0); }));
        const pdfData = new Uint8Array(byteArray);

        pdfjsLib.getDocument({ data: pdfData }).promise.then(pdfloaded => {
            pdf = pdfloaded;
            totalPages = pdf.numPages;
            renderPage(1)
        });
    }
}

const renderPage = pageNum => {
    return pdf.getPage(pageNum).then(page => {
    const c_container = document.getElementById("pdf-viewer")
    const viewport = page.getViewport({scale:c_container.clientHeight / page.getViewport({scale:1}).height});
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    removeAllCanvases()
    container.appendChild(canvas);

    return page.render({
        canvasContext: context,
        viewport: viewport
    }).promise;
    });
};


function changePage(offset) {
    const newPage = currentPage + offset;
    if (newPage < 1 || newPage > totalPages) return;
    currentPage = newPage;
    renderPage(currentPage);
}

function removeAllCanvases() {
    const container = document.getElementById('pdf-viewer');
    container.querySelectorAll('canvas').forEach(canvas => canvas.remove());
}

function nextSong(){
    generateSong();
    location.reload(true);
}