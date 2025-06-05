// Ensure the pdfBase64 variable is available after the pdf-base64.js is imported
if (typeof pdfBase64 === 'undefined') {
    console.error('pdfBase64 is not defined. Make sure pdf-base64.js is properly loaded.');
} else {
    const container = document.getElementById('pdf-viewer');

    // Decode the Base64 string and load the PDF as a binary string
    const byteArray = new Uint8Array(atob(pdfBase64).split("").map(function(c) { return c.charCodeAt(0); }));
    const pdfData = new Uint8Array(byteArray);

    pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    pdfjsLib.getDocument({ data: pdfData }).promise.then(pdf => {
    const renderPage = pageNum => {
        return pdf.getPage(pageNum).then(page => {
        const viewport = page.getViewport({ scale: 1 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        container.appendChild(canvas);

        return page.render({
            canvasContext: context,
            viewport: viewport
        }).promise;
        });
    };

    const renderAllPages = async () => {
        for (let i = 1; i <= pdf.numPages; i++) {
        await renderPage(i);
        }
    };

    renderAllPages();
    });
}