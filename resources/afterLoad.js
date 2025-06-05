function afterLoad() {
    // Load the game state
    const gameState = loadGameState();
    console.log('Game state loaded:', gameState);

    // If there is no game state, go to home screen
    if (!gameState) {
        // Redirect to home screen
        console.log('No game state found, redirecting to home screen');
        // if not already on home screen

        return;
    }

    // If there is game state with no pack selected, go to pack selection screen
    if (!gameState.selectedSongPackId) {
        // Redirect to pack selection screen
        console.log('No pack selected, redirecting to pack selection screen');

        return;
    }

    // If there is game state with pack selected and song selected, go to game screen
    

    // If there is game state with pack selected and no song selected, restart game corrupted game

}