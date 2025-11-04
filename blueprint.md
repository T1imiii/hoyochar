
# Blueprint

## Overview

This application is a multi-page website dedicated to the Hoyoverse games, featuring sections for characters from Genshin Impact, Honkai Star Rail, and Zenless Zone Zero. It also includes a functional music player with tracks and albums from the games.

## Project Structure

*   `index.html`: Main HTML file with the structure for all pages.
*   `style.css`: Main stylesheet for general layout and character pages.
*   `music.css`: Dedicated stylesheet for the music page.
*   `main.js`: Main JavaScript file handling navigation and character page logic.
*   `music.js`: Dedicated JavaScript file for all music player functionality, including track/album loading, playback controls, and UI updates.
*   `*.json`: Data files for characters and music (`characters.json`, `honkai_star_rail.json`, `zenless_zone_zero.json`, `music.json`).
*   `images/`: Folder containing all images for characters, logos, and UI elements.
*   `music/`: Folder containing audio files.

## Implemented Features & Design

### General
*   **Multi-page Navigation:** A top navigation bar allows users to switch between Home, Characters, Music, and News sections.
*   **Dynamic Theme Engine:** The color scheme of the character page dynamically adapts based on the currently displayed character's main image.
*   **Responsive Design:** The layout is designed to be functional across different screen sizes.

### Home Page
*   **Redesigned Layout:** A visually appealing landing page with a large central logo and three interactive navigation cards.
*   **Navigation Cards:** Each card represents a main section of the site (Characters, Music, News), featuring a relevant image, a short description, and a button to navigate to the section.

### Character Pages
*   **Game Selection:** Users can choose to view characters from Genshin Impact, Honkai Star Rail, or Zenless Zone Zero via a dropdown menu.
*   **Region/Faction Filtering:** Characters can be filtered by their in-game region or faction using a side navigation bar.
*   **Interactive Character Display:**
    *   A vertical carousel of character cards.
    *   A main view showing the selected character's artwork, name, and description.
    *   Smooth animations and transitions between characters.
    *   A background that changes to match the selected character.
*   **Video Demos:** An option to watch a character's demonstration video in a modal window.

### Music Page
*   **Layout:** A two-column layout featuring a list of popular tracks and albums on the left, and a dedicated music player on the right.
*   **Music Player:**
    *   Displays artwork, title, and artist of the current track.
    *   Controls for play/pause, next track, and previous track.
    *   A draggable progress bar to seek through the track, showing current and total time.
    *   A draggable volume control.
*   **Track Lists:**
    *   A "Popular Tracks" section for quick access to popular songs.
    *   An "Albums" section, displayed as a grid.
*   **Album Modal:**
    *   Clicking an album opens a modal window.
    *   The modal displays the album cover, details, and a full tracklist for that album.
    *   Users can play the entire album or select individual tracks from the modal.
*   **Dynamic Playlists:** The player's playlist updates based on whether the user is playing from the "Popular Tracks" list or a specific album.

### News Page
*   **VK Feed Integration:** Displays a live news feed from a specified VK.com group.
*   **Rich Post Display:** Renders posts with text, images (in a grid layout), and basic engagement stats (likes, comments, reposts).

## Previous Plan (Completed)

1.  **Redesign Home Page:**
    *   **Update `index.html`:** Replaced the old home page content with a new structure including a large logo and three navigation cards.
    *   **Update `style.css`:** Added new styles for the redesigned home page elements, ensuring a modern and visually appealing layout. Removed old, unused styles.
    *   **Update `main.js`:** Replaced the old button's event listener with a new, more flexible listener for the navigation cards to handle navigation to different sections.
2.  **Separate JS Logic:** Create a new `music.js` file to house all JavaScript functionality for the music page.
3.  **Refactor `main.js`:** Remove all music-related code from `main.js` and adjust the `switchPage` function to call the initialization function from `music.js`.
4.  **Update `index.html`:**
    *   Refactor the HTML structure for the music page (`#music-page`) to a two-column layout (left panel for lists, right panel for the player).
    *   Include the new `music.js` script.
5.  **Implement Music Logic in `music.js`:**
    *   Fetch music data from `music.json`.
    *   Populate the "Popular Tracks" and "Albums" sections.
    *   Implement full player controls (play, pause, next, previous).
    *   Implement a draggable progress bar and volume control.
    *   Create a modal view for displaying album tracklists.
    *   Handle playlist management (switching between popular list and album lists).
6.  **Update `music.css`:** Rewrite the CSS to style the new two-column layout, the player, the lists, and the album modal, ensuring a polished and modern look.

## Current Plan

The application is now fully functional as per the last request. Ready for further instructions.
