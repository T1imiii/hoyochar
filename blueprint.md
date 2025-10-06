# Blueprint: Hoyoverse Character & News Hub

## 1. Project Overview

This project is a modern, single-page web application designed for fans of Hoyoverse games (Genshin Impact, Honkai Star Rail, Zenless Zone Zero). It provides a rich, interactive experience for exploring characters from each game and staying updated with the latest news via a live feed from a VKontakte group. The application is built with vanilla HTML, CSS, and JavaScript, emphasizing modern design principles, dynamic UI, and responsiveness.

---

## 2. Core Application Pages

The application is structured into three main pages:

### **HOME Page**
*   **Purpose:** Serves as the landing page, offering a visually engaging introduction to the Hoyoverse universe.
*   **Layout:** Features a full-screen background and centered content.
*   **Content:**
    *   A prominent headline: "Исследуй миры Hoyoverse" (Explore the worlds of Hoyoverse).
    *   A brief introductory paragraph about the site's purpose.
    *   A "Начать просмотр" (Start Browsing) button that navigates the user to the character browser.

### **CHARACTERS Page**
*   **Purpose:** The central feature of the application, allowing users to browse and learn about characters from the different games.
*   **Layout:** A sophisticated three-column design:
    1.  **Left Sidebar:** A vertically scrollable list of character cards. Each card shows a small image and the character's name. This list is filterable by the selected game and region.
    2.  **Center Content:** The main view area that displays the currently selected character in detail. It includes a large character image, their name, a multi-paragraph description, and a button to watch a demo video (if available).
    3.  **Right Sidebar:** A vertical navigation bar that allows users to select a game (Genshin Impact, Honkai Star Rail, Zenless Zone Zero) and then filter characters by their in-game region.
*   **Dynamic Theming:** A key visual feature where the UI's accent colors, glows, and shadows dynamically adapt based on the dominant colors of the selected character's main image, creating a unique and immersive theme for each hero.

### **NEWS Page**
*   **Purpose:** To provide users with the latest news and updates.
*   **Layout:** A single, scrollable column that displays a feed of news posts.
*   **Content:** Posts are fetched in real-time from a specified VKontakte (VK) group. The feed displays the post text and any attached images.
*   **Style:** Each post is formatted as a distinct "card" with a clean, modern aesthetic that matches the overall design of the application.

---

## 3. Features & Functionality

*   **Multi-Page Navigation:** Seamless navigation between the "HOME," "CHARACTERS," and "NEWS" pages without page reloads.
*   **Multi-Game & Regional Filtering:** The character browser is intuitively organized by game and further by in-game regions, allowing users to easily find specific characters.
*   **Dynamic Character Loading:** All character data (names, descriptions, images, video links) is loaded asynchronously from local JSON files (`characters.json`, `honkai_star_rail.json`, `zenless_zone_zero.json`), ensuring the app is fast and easily updatable.
*   **Interactive Character Switching:** Users can fluidly switch between characters by scrolling through the list or clicking on a specific card. The transition is smooth, with loading animations to handle image fetching.
*   **Video Modal:** A pop-up (modal) window allows users to watch character demonstration videos without leaving the page.
*   **VKontakte Integration:** The "NEWS" page utilizes the VK API to display a live feed of posts directly from a community group.
*   **Responsive Design:** The layout intelligently adapts to various screen sizes, ensuring a consistent and user-friendly experience on both desktop and mobile devices.
*   **Visual Polish:** The UI incorporates modern design elements like gradients, drop shadows, and subtle animations to create a visually appealing and premium feel.

---

## 4. Current Development Plan

*There are no active development plans. The project is in a complete state based on the last set of implemented features.*
