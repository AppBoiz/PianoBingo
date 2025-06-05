
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        let url;
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            url = '/service-worker.js'
        } else {
            url = '/PianoBingo/service-worker.js'
        }

        navigator.serviceWorker.register(url)
            .then((registration) => {
                console.log('Service Worker registered with scope:', registration.scope);
            })
            .catch((error) => {
                console.log('Service Worker registration failed:', error);
            });
    });
}

let deferredPrompt;

window.addEventListener('beforeinstallprompt', (event) => {
    console.log("Event trigger")
    event.preventDefault();
    deferredPrompt = event;
    const installBtn = document.createElement('button');
    installBtn.textContent = 'Install PWA';
    // document.body.appendChild(installBtn);

    installBtn.addEventListener('click', () => {
        deferredPrompt.prompt();

        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the install prompt');
            } else {
                console.log('User dismissed the install prompt');
            }
            deferredPrompt = null;
        });
    });
});


