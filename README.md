# PianoBingo
Piano bingo native app

## Navigation

This is a single page application, which uses iframes to dynamically render the content. To register the app content container, the `services/navigation/host.js` script is linked to the html file it is contained in. Content pages link the script `services/navigation/navigation.js` and can use the function loadPage() in combination with the makshift `PAGES` enum, which should be extended when a page is added.

Internally, it uses events to communicate between origins, telling the parent when to switch to a different page.

## PDF Compilation

To compile pdfs into a bundled .js file, there is a python util. This is a workaround for localhost to avoid cors issues.
