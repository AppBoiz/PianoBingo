
function loadPage(page) {
    const iframe = document.getElementById('app-content-frame');
    iframe.src = page;
}

window.addEventListener('message', (event) => {
   if (event.data.type === "goToPage") {
        console.log("Switching to page " + event.data.page);
        loadPage(event.data.page);
    }
});