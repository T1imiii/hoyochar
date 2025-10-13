# Blueprint: Hoyoverse Character and Music Explorer

## Overview

This application serves as a comprehensive guide to the characters from Hoyoverse's popular games: Genshin Impact, Honkai Star Rail, and Zenless Zone Zero. It also features a dedicated section for the music from these games, allowing users to browse albums and listen to popular tracks.

## Project Outline

### Style and Design

*   **Theme:** Modern, dark theme with purple accents, inspired by the Hoyoverse aesthetic.
*   **Layout:** Single-page application with distinct sections for Home, Characters, and Music.
*   **Typography:** Clean, sans-serif fonts for readability.
*   **Imagery:** High-quality character art and album covers.
*   **Interactivity:** Smooth transitions between pages, interactive character cards, and a persistent music player.

### Features

*   **Home Page:** A welcoming landing page with a brief introduction to the site.
*   **Characters Page:**
    *   Filter by game (Genshin Impact, Honkai Star Rail, Zenless Zone Zero).
    *   Character grid with portraits.
    *   Detailed character view upon selection, including:
        *   Full-size character image.
        *   Character description.
        *   Demo video.
*   **Music Page:**
    *   **Popular Tracks:** A list of the top 5 most popular tracks.
    *   **Album Carousel:** A horizontally scrollable list of albums.
    *   **Album Detail View:** Displays album cover, information, and tracklist.
    *   **Persistent Audio Player:** Appears when a track is played, with controls for play/pause, and track information.

## Current Task: Implement Audio Playback Functionality

**Plan:**

1.  **`index.html` Modification:**
    *   Add the HTML structure for a persistent audio player at the bottom of the page. This will include an `<audio>` tag and UI elements for controls and track info.

2.  **`style.css` Modification:**
    *   Add CSS to style the new audio player, ensuring it is visually appealing and fixed to the bottom of the screen.

3.  **`main.js` Modifications:**
    *   Create new DOM element selectors for the audio player.
    *   Implement a `playTrack` function to load and play a selected track.
    *   Add event listeners to the play/pause button to control audio playback.
    *   Attach event listeners to all track items (in popular lists and album views) to trigger the `playTrack` function on click.
    *   Update the player UI with the current track's metadata (title, artist, cover).

**Actionable Steps:**

1.  **Modify `index.html`:** Add the HTML for the audio player.
2.  **Modify `style.css`:** Add styles for the audio player.
3.  **Modify `main.js`:** Implement the JavaScript logic for audio playback.
