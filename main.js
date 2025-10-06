document.addEventListener('DOMContentLoaded', () => {

    // --- DOM ELEMENTS ---
    const topNav = document.querySelector('.top-nav');
    const startBrowsingBtn = document.getElementById('start-browsing-btn');
    const pages = document.querySelectorAll('.page');
    const scrollIndicator = document.querySelector('.scroll-indicator');
    const charactersLink = document.querySelector('.characters-link');

    const characterListEl = document.querySelector('#characters-page .character-list');
    const mainContent = document.querySelector('#characters-page .main-content');
    const regionNav = document.querySelector('#characters-page .side-nav');
    const backgroundContainer = document.querySelector('#characters-page .background-container');
    const root = document.documentElement;

    const newsFeedEl = document.querySelector('#news-page .news-feed');

    // Video Modal Elements
    const videoModal = document.getElementById('video-modal');
    const videoModalOverlay = document.querySelector('.video-modal-overlay');
    const closeVideoBtn = document.querySelector('.close-video-btn');
    const videoPlayer = videoModal.querySelector('video');

    // --- STATE VARIABLES ---
    let activeCharacterIndex = 0;
    let isScrolling = false;
    let allCharacters = [];
    let currentCharacters = [];
    let currentGame = 'characters';
    const gameDataCache = {};
    let newsLoaded = false;

    // --- CORE PAGE NAVIGATION ---
    function switchPage(targetPageId, game = null) {
        pages.forEach(page => page.classList.remove('active'));
        const targetPage = document.getElementById(targetPageId);
        if (targetPage) targetPage.classList.add('active');

        document.querySelectorAll('.top-nav a').forEach(link => link.classList.remove('active'));
        
        if (targetPageId === 'home-page') {
            document.querySelector('.top-nav a[data-target="home"]').classList.add('active');
        } else if (targetPageId === 'characters-page') {
            charactersLink.classList.add('active');
        } else if (targetPageId === 'news-page') {
            const newsLink = document.querySelector('.top-nav a[data-target="news"]');
            if(newsLink) newsLink.classList.add('active');
        }

        scrollIndicator.style.display = targetPageId === 'characters-page' ? 'block' : 'none';

        if (targetPageId === 'characters-page' && game) {
            initializeCharactersPage(game);
        }
        if (targetPageId === 'news-page') {
            initializeNewsPage();
        }
    }

    // --- THEME ENGINE --- //
    function getAverageColorFromImage(imgUrl) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.src = imgUrl;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.width; canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                const data = ctx.getImageData(0, 0, img.width, img.height).data;
                let r = 0, g = 0, b = 0, count = 0;
                for (let i = 0; i < data.length; i += 20) { // Sample pixels for performance
                    r += data[i]; g += data[i+1]; b += data[i+2];
                    count++;
                }
                resolve({ r: ~~(r/count), g: ~~(g/count), b: ~~(b/count) });
            };
            img.onerror = reject;
        });
    }

    function rgbToHsl(r, g, b) {
        r /= 255, g /= 255, b /= 255;
        let max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;
        if (max == min) { h = s = 0; } else {
            let d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch(max){ case r: h = (g - b) / d + (g < b ? 6 : 0); break; case g: h = (b - r) / d + 2; break; case b: h = (r - g) / d + 4; break; }
            h /= 6;
        }
        return [h, s, l];
    }

    async function updateTheme(imageUrl) {
        try {
            const { r, g, b } = await getAverageColorFromImage(imageUrl);
            const [h, s, l] = rgbToHsl(r, g, b);

            const accentColor = `hsl(${h * 360}, ${Math.min(s + 0.3, 1) * 100}%, ${Math.max(l, 0.5) * 100}%)`;
            const brightAccent = `hsl(${h * 360}, ${Math.min(s + 0.4, 1) * 100}%, ${Math.min(l + 0.1, 0.6) * 100}%)`;
            const activeCardBg = `hsla(${h * 360}, ${s * 100}%, ${l * 100}%, 0.2)`;
            const glowColor = `hsla(${h * 360}, ${Math.min(s + 0.3, 1) * 100}%, ${Math.max(l, 0.5) * 100}%, 0.6)`;
            const dynamicBorderColor = `hsla(${h * 360}, ${s * 100}%, ${l * 100}%, 0.5)`;

            root.style.setProperty('--accent-color', accentColor);
            root.style.setProperty('--accent-gradient', `linear-gradient(to right, ${brightAccent}, transparent)`);
            root.style.setProperty('--character-card-active-bg', activeCardBg);
            root.style.setProperty('--character-card-glow-color', glowColor);
            root.style.setProperty('--dynamic-border-color', dynamicBorderColor);
        } catch (error) {
            console.error("Failed to update theme:", error);
            // Reset to default on error
            root.style.setProperty('--accent-color', '#bf7bf1');
            root.style.setProperty('--accent-gradient', 'linear-gradient(to right, #d900ff, transparent)');
            root.style.setProperty('--character-card-active-bg', 'rgba(191, 123, 241, 0.2)');
            root.style.setProperty('--character-card-glow-color', 'rgba(191, 123, 241, 0.6)');
            root.style.setProperty('--dynamic-border-color', 'rgba(255, 255, 255, 0.1)');
        }
    }

    // --- NEWS PAGE LOGIC (VK INTEGRATION) ---
    const VK_SERVICE_KEY = 'd2c88a3bd2c88a3bd2c88a3b7fd1f2e7a9dd2c8d2c88a3bba07cfabe2eecc692b1e3731';
    const VK_GROUP_ID = '232798999';

    async function initializeNewsPage() {
        if (newsLoaded) return; // Don't reload if already loaded

        newsFeedEl.innerHTML = '<p>Loading news...</p>';

        // SECURITY WARNING: The service access key is exposed here. This is insecure for production.
        // A secure backend proxy is the recommended approach.
        const API_URL = `https://api.vk.com/method/wall.get?owner_id=-${VK_GROUP_ID}&count=20&extended=1&access_token=${VK_SERVICE_KEY}&v=5.199`;

        try {
            // VK API requires a script tag to be added for JSONP.
            await new Promise((resolve, reject) => {
                const script = document.createElement('script');
                const callbackName = 'vkCallback';
                window[callbackName] = (data) => {
                    delete window[callbackName];
                    document.body.removeChild(script);
                    if (data.response) {
                        renderPosts(data.response);
                        resolve();
                    } else {
                        console.error('VK API Error:', data.error);
                        reject(new Error(data.error.error_msg));
                    }
                };
                script.src = `${API_URL}&callback=${callbackName}`;
                script.onerror = reject;
                document.body.appendChild(script);
            });
            newsLoaded = true;
        } catch (error) {
            console.error('Failed to fetch VK news:', error);
            newsFeedEl.innerHTML = `<p>Error loading news. Please check the console for details.</p>`;
        }
    }

    function renderPosts(response) {
        const posts = response.items;
        const groupInfo = response.groups[0];

        if (!posts || posts.length === 0) {
            newsFeedEl.innerHTML = '<p>No news to display.</p>';
            return;
        }
        
        let feedHTML = '';
        posts.forEach(post => {
            const postDate = new Date(post.date * 1000).toLocaleString();
            const postText = post.text.replace(/\n/g, '<br>');

            let attachmentsHTML = '';
            if (post.attachments && post.attachments.length > 0) {
                attachmentsHTML += '<div class="post-attachments">';
                post.attachments.forEach(attachment => {
                    if (attachment.type === 'photo') {
                        const bestSize = attachment.photo.sizes.sort((a, b) => b.width - a.width)[0];
                        attachmentsHTML += `<a href="${bestSize.url}" target="_blank"><img src="${bestSize.url}" alt="Post attachment"></a>`;
                    }
                });
                attachmentsHTML += '</div>';
            }

            feedHTML += `
                <div class="post-card">
                    <div class="post-header">
                        <img src="${groupInfo.photo_100}" alt="${groupInfo.name}" class="post-avatar">
                        <span class="post-author">${groupInfo.name}</span>
                    </div>
                    <p class="post-text">${postText}</p>
                    ${attachmentsHTML}
                    <div class="post-footer">
                        <div class="post-stats">
                            <span class="post-stat"><svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>${post.likes.count}</span>
                            <span class="post-stat"><svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>${post.comments.count}</span>
                            <span class="post-stat"><svg viewBox="0 0 24 24"><path d="M7 14l5-5 5 5H7z"/></svg>${post.reposts.count}</span>
                        </div>
                        <div class="post-date">${postDate}</div>
                    </div>
                </div>
            `;
        });

        newsFeedEl.innerHTML = feedHTML;
    }


    // --- VIDEO MODAL LOGIC ---
    function openVideoModal(src) {
        if (src) {
            videoPlayer.src = src;
            videoModal.classList.add('active');
            videoPlayer.play();
        }
    }

    function closeVideoModal() {
        videoModal.classList.remove('active');
        videoPlayer.pause();
        videoPlayer.src = '';
    }

    // --- CHARACTERS PAGE LOGIC --- //
    async function initializeCharactersPage(game) {
        currentGame = game;
        mainContent.innerHTML = ''; characterListEl.innerHTML = ''; regionNav.innerHTML = ''; backgroundContainer.innerHTML = '';

        try {
            allCharacters = gameDataCache[game] || await (async () => {
                const response = await fetch(`./${game}.json`);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const data = await response.json();
                gameDataCache[game] = data;
                return data;
            })();

            let regions, defaultRegionName;
            if (game === 'characters') {
                regions = ['MONSTADT', 'LIYUE', 'INAZUMA', 'SUMERU', 'FONTAINE', 'NATLAN'];
                defaultRegionName = 'MONSTADT';
            } else if (game === 'honkai_star_rail') {
                regions = ['Destruction', 'Hunt', 'Erudition', 'Harmony', 'Nihility', 'Preservation', 'Abundance', 'Memory'];
                defaultRegionName = 'Destruction';
            } else {
                regions = [...new Set(allCharacters.map(char => char.region))];
                defaultRegionName = (game === 'zenless_zone_zero') ? 'New Eridu' : regions[0];
            }

            regionNav.innerHTML = regions.map(r => `<a href="#">${r.toUpperCase()}</a>`).join('');
            
            const defaultRegionLink = Array.from(regionNav.querySelectorAll('a')).find(link => link.textContent.toLowerCase() === defaultRegionName?.toLowerCase()) || regionNav.querySelector('a');

            if (defaultRegionLink) {
                defaultRegionLink.classList.add('active');
                renderCharacterContent(defaultRegionLink.textContent.trim());
            } else {
                mainContent.innerHTML = `<div class="character-info"><h1 class="character-name">Coming Soon</h1><p>Characters for this game will be added soon.</p></div>`;
            }
        } catch (error) {
            console.error(`Could not initialize characters for ${game}:`, error);
            mainContent.innerHTML = `<div class="character-info"><h1 class="character-name">Error</h1><p>Could not load character data. Please try again later.</p></div>`;
        }
    }

    function renderCharacterContent(region) {
        currentCharacters = allCharacters.filter(char => char.region.toUpperCase() === region.toUpperCase());
        let scenesHTML = '', listHTML = '', bgHTML = '';

        if (currentCharacters.length === 0) {
            mainContent.innerHTML = `<div class="character-info" style="text-align: center; max-width: 600px;"><h1 class="character-name" style="font-size: 3.5rem;">Coming Soon</h1><p>Characters from this region will be added soon.</p></div>`;
            characterListEl.innerHTML = '';
            backgroundContainer.innerHTML = '';
            return;
        }

        currentCharacters.forEach((char, index) => {
            const isActive = index === 0;
            const nameHTML = char.name;
            
            const videoButtonHTML = char.demoVideo ? `
                <button class="watch-demo-btn" data-video-src="${char.demoVideo}">
                    <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    <div>
                        <span class="demo-text-label">Watch Character Demo:</span>
                        <span>\"${char.name}: Demo\"</span>
                    </div>
                </button>` : '';

            bgHTML += `<div class="background-image ${isActive ? 'active' : ''}" style="background-image: url('${char.image}');" data-index="${index}"></div>`;
            scenesHTML += `
                <div class="scene ${isActive ? 'active' : ''}" data-index="${index}">
                    <div class="character-info">
                        <h1 class="character-name">${nameHTML}</h1>
                        <div class="name-separator"></div>
                        <p class="character-description">${char.description}</p>
                    </div>
                    ${videoButtonHTML}
                </div>`;
            listHTML += `<div class="character-card ${isActive ? 'active' : ''}" data-index="${index}"><img src="${char.cardImage}" alt="${char.name}"><div class="character-name-overlay">${char.name}</div></div>`;
        });

        backgroundContainer.innerHTML = bgHTML;
        mainContent.innerHTML = scenesHTML;
        characterListEl.innerHTML = listHTML;
        activeCharacterIndex = 0;

        if (currentCharacters.length > 0) updateTheme(currentCharacters[0].image);
    }

    function setActiveCharacter(index) {
        if (isScrolling || index < 0 || index >= currentCharacters.length || index === activeCharacterIndex) return;
        isScrolling = true;
        activeCharacterIndex = index;

        document.querySelectorAll('#characters-page .background-image, #characters-page .scene, #characters-page .character-card').forEach(el => el.classList.remove('active'));
        document.querySelector(`#characters-page .background-image[data-index="${index}"]`).classList.add('active');
        document.querySelector(`#characters-page .scene[data-index="${index}"]`).classList.add('active');
        const activeCard = document.querySelector(`#characters-page .character-card[data-index="${index}"]`);
        activeCard.classList.add('active');
        activeCard.scrollIntoView({ behavior: 'smooth', block: 'center' });

        if (currentCharacters[index]) updateTheme(currentCharacters[index].image);
        setTimeout(() => { isScrolling = false; }, 800);
    }

    // --- EVENT LISTENERS ---
    topNav.addEventListener('click', (e) => {
        const link = e.target.closest('a[data-target]');
        if (!link) return;
        e.preventDefault();
        const targetPage = link.dataset.target;
        const game = link.dataset.game;
        if (targetPage === 'characters' && game) {
            switchPage('characters-page', game);
        } else if (targetPage === 'home') {
            switchPage('home-page');
        } else if (targetPage === 'news') {
            switchPage('news-page');
        }
    });

    startBrowsingBtn.addEventListener('click', () => switchPage('characters-page', 'characters'));

    window.addEventListener('wheel', (e) => {
        if (!document.getElementById('characters-page').classList.contains('active') || isScrolling) return;
        setActiveCharacter(activeCharacterIndex + (e.deltaY > 0 ? 1 : -1));
    });

    characterListEl.addEventListener('click', (e) => {
        const card = e.target.closest('.character-card');
        if (card) setActiveCharacter(parseInt(card.dataset.index));
    });

    regionNav.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (link && !link.classList.contains('active')) {
            e.preventDefault();
            document.querySelectorAll('#characters-page .side-nav a').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            renderCharacterContent(link.textContent.trim());
        }
    });

    // Video Modal Listeners
    mainContent.addEventListener('click', (e) => {
        const demoBtn = e.target.closest('.watch-demo-btn');
        if (demoBtn) {
            openVideoModal(demoBtn.dataset.videoSrc);
        }
    });
    closeVideoBtn.addEventListener('click', closeVideoModal);
    videoModalOverlay.addEventListener('click', closeVideoModal);
    
    // Initial setup
    switchPage('home-page');
});
