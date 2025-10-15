document.addEventListener('DOMContentLoaded', () => {
    const musicPage = document.getElementById('music-page');
    if (!musicPage) return;

    // --- DOM ELEMENTS ---
    const trackList = musicPage.querySelector('.track-list');
    const albumList = musicPage.querySelector('.album-list');
    const audio = new Audio();
    const trackImgPlayer = musicPage.querySelector('.track-img-player');
    const trackTitlePlayer = musicPage.querySelector('.track-title-player');
    const trackArtistPlayer = musicPage.querySelector('.track-artist-player');
    const playBtn = musicPage.querySelector('.play-btn');
    const prevBtn = musicPage.querySelector('.prev-btn');
    const nextBtn = musicPage.querySelector('.next-btn');
    const progressBar = musicPage.querySelector('.progress');
    const progressControl = musicPage.querySelector('.progress-bar');
    const currentTimeEl = musicPage.querySelector('.current-time');
    const totalTimeEl = musicPage.querySelector('.total-time');
    const volumeBar = musicPage.querySelector('.volume-progress');
    const volumeControl = musicPage.querySelector('.volume-bar');
    const volumeIcon = musicPage.querySelector('.volume-icon');

    // --- STATE VARIABLES ---
    let musicData = {};
    let currentTrackIndex = 0;
    let currentPlaylist = [];
    let isPlaying = false;
    let musicLoaded = false;
    let isSeeking = false;

    // --- MUSIC CONTROL & DATA ---
    async function initializeMusicPage() {
        if (musicLoaded) return;
        try {
            const response = await fetch('./music.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            musicData = await response.json();
            renderMusicPage();
            setVolume(0.3);
            musicLoaded = true;
        } catch (error) {
            console.error('Could not initialize music page:', error);
            musicPage.innerHTML = `<p>Error loading music data.</p>`;
        }
    }

    function pauseMusic() {
        if (isPlaying) audio.pause();
    }
    window.pauseMusic = pauseMusic; // Make it globally accessible

    function playTrack(trackIndex, playlistName) {
        currentPlaylist = setupPlaylist(playlistName);
        if (trackIndex < 0 || trackIndex >= currentPlaylist.length) return;

        currentTrackIndex = trackIndex;
        const track = currentPlaylist[trackIndex];

        // Reset UI for new track
        progressBar.style.width = '0%';
        currentTimeEl.textContent = '0:00';
        totalTimeEl.textContent = track.duration || '0:00';

        audio.src = track.url;
        updatePlayerUI(track);
        updateActiveTracklist(playlistName);

        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => console.error("Playback error:", error));
        }
    }

    // --- UI UPDATES ---
    function renderMusicPage() {
        const popularTracks = getPopularTracks();
        trackList.innerHTML = popularTracks.map((track, displayIndex) => createTrackItemHTML(track, displayIndex, 'popular')).join('');
        currentPlaylist = popularTracks;
        if (popularTracks.length > 0) {
            updatePlayerUI(popularTracks[0]);
        }

        albumList.innerHTML = musicData.albums.map(createAlbumItemHTML).join('');
    }

    function updatePlayerUI(track) {
        if (!track) return;
        trackImgPlayer.src = track.cover;
        trackTitlePlayer.textContent = track.title;
        trackArtistPlayer.textContent = track.artist;
    }

    function updateProgress() {
        // Don't update UI if user is actively seeking
        if (isSeeking || !isFinite(audio.duration)) return;
        
        const progressPercent = (audio.currentTime / audio.duration) * 100;
        progressBar.style.width = `${progressPercent}%`;
        currentTimeEl.textContent = formatTime(audio.currentTime);
        totalTimeEl.textContent = formatTime(audio.duration);
    }

    function updateActiveTracklist(currentPlaylistName) {
        document.querySelectorAll('#music-page .track-item').forEach(item => item.classList.remove('active'));
        const activeItem = document.querySelector(`#music-page .track-item[data-playlist='${currentPlaylistName}'][data-track-index='${currentTrackIndex}']`);
        if (activeItem) activeItem.classList.add('active');
    }

    // --- PLAYLIST & DATA HELPERS ---
    function getPopularTracks() {
        return musicData.popularTracks
            .sort((a, b) => b.popularity - a.popularity)
            .slice(0, 5)
            .map(trackData => {
                const album = musicData.albums.find(a => a.id === trackData.albumId);
                if (!album || !album.tracks[trackData.trackIndex]) return null;
                const track = album.tracks[trackData.trackIndex];
                return { ...track, albumTitle: album.title, cover: album.cover, artist: album.artist, albumId: album.id };
            }).filter(Boolean);
    }

    function setupPlaylist(playlistName) {
        if (playlistName === 'popular') return getPopularTracks();
        const album = musicData.albums.find(a => a.id === playlistName);
        if (!album) return [];
        return album.tracks.map(track => ({ ...track, cover: album.cover, artist: album.artist, albumTitle: album.title, albumId: album.id }));
    }

    // --- HTML TEMPLATES ---
    function createTrackItemHTML(track, index, playlistId) {
        return `
            <div class="track-item" data-track-index="${index}" data-playlist="${playlistId}">
                <div class="track-item-left">
                    <span class="track-number">${index + 1}</span>
                    <img src="${track.cover}" alt="${track.title}" class="track-img">
                    <div class="track-info">
                        <div class="track-title">${track.title}</div>
                        <div class="track-artist">${track.artist}</div>
                    </div>
                </div>
                <div class="track-item-right">
                    <div class="track-duration">${track.duration}</div>
                </div>
            </div>`;
    }

    function createAlbumItemHTML(album) {
        return `
            <div class="album-item" data-album-id="${album.id}">
                 <div class="album-cover-container">
                    <img src="${album.cover}" alt="${album.title}" class="album-img">
                    <div class="album-tags">
                        <span class="album-tag-artist">${album.artist}</span>
                        <span class="album-tag-year">${album.year}</span>
                    </div>
                 </div>
                 <div class="album-info"><div class="album-title">${album.title}</div></div>
            </div>`;
    }

    // --- PLAYER ACTIONS ---
    function togglePlayPause() {
        if (!audio.src) {
            if (currentPlaylist.length > 0) playTrack(0, 'popular');
            return;
        }
        isPlaying ? audio.pause() : audio.play();
    }

    function playNext() {
        const playlistName = currentPlaylist[0]?.albumId ? (currentPlaylist.every(t => t.albumId === currentPlaylist[0].albumId) ? currentPlaylist[0].albumId : 'popular') : 'popular';
        const nextIndex = (currentTrackIndex + 1) % currentPlaylist.length;
        playTrack(nextIndex, playlistName);
    }

    function playPrev() {
        const playlistName = currentPlaylist[0]?.albumId ? (currentPlaylist.every(t => t.albumId === currentPlaylist[0].albumId) ? currentPlaylist[0].albumId : 'popular') : 'popular';
        const prevIndex = (currentTrackIndex - 1 + currentPlaylist.length) % currentPlaylist.length;
        playTrack(prevIndex, playlistName);
    }

    // --- UTILITY FUNCTIONS ---
    function formatTime(seconds) {
        if (isNaN(seconds) || !isFinite(seconds)) return "0:00";
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    }

    function setVolume(volume) {
        audio.volume = volume;
        volumeBar.style.width = `${volume * 100}%`;
        volumeIcon.src = volume > 0 ? 'images/volume.svg' : 'images/volume-mute.svg';
    }

    // --- EVENT LISTENERS ---

    // Audio Element Events
    audio.addEventListener('play', () => { isPlaying = true; playBtn.querySelector('img').src = 'images/pause.svg'; });
    audio.addEventListener('pause', () => { isPlaying = false; playBtn.querySelector('img').src = 'images/play.svg'; });
    audio.addEventListener('loadedmetadata', () => { totalTimeEl.textContent = formatTime(audio.duration); });
    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', playNext);

    // Player Controls
    playBtn.addEventListener('click', togglePlayPause);
    nextBtn.addEventListener('click', playNext);
    prevBtn.addEventListener('click', playPrev);

    // Playlist Clicks
    trackList.addEventListener('click', (e) => {
        const trackItem = e.target.closest('.track-item');
        if (trackItem) playTrack(parseInt(trackItem.dataset.trackIndex), trackItem.dataset.playlist);
    });

    albumList.addEventListener('click', (e) => {
        const albumItem = e.target.closest('.album-item');
        if (albumItem) showAlbumModal(albumItem.dataset.albumId);
    });
    
    function showAlbumModal(albumId) {
        const album = musicData.albums.find(a => a.id === albumId);
        if (!album) return;

        const modal = document.createElement('div');
        modal.className = 'album-modal';
        modal.innerHTML = `
            <div class="album-modal-content">
                <button class="close-album-modal">&times;</button>
                <div class="album-modal-header">
                    <img src="${album.cover}" alt="${album.title}">
                    <div class="album-modal-info">
                        <h1>${album.title}</h1>
                        <p>${album.artist} &bull; ${album.year}</p>
                        <button class="play-album-btn" data-album-id="${album.id}">Play Album</button>
                    </div>
                </div>
                <div class="album-modal-tracklist">
                    ${album.tracks.map((track, index) => createTrackItemHTML(track, index, album.id)).join('')}
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        const closeModal = () => document.body.removeChild(modal);
        modal.addEventListener('click', (e) => {
            if (e.target.classList.contains('album-modal') || e.target.closest('.close-album-modal')) closeModal();
        });
        modal.querySelector('.play-album-btn').addEventListener('click', () => {
            playTrack(0, album.id);
            closeModal();
        });
        modal.querySelector('.album-modal-tracklist').addEventListener('click', (e) => {
            const trackItem = e.target.closest('.track-item');
            if (trackItem) {
                playTrack(parseInt(trackItem.dataset.trackIndex), trackItem.dataset.playlist);
                closeModal();
            }
        });
    }

    // Volume Controls
    const handleVolumeDrag = (e) => {
        const rect = volumeControl.getBoundingClientRect();
        const volume = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        setVolume(volume);
    };
    volumeControl.addEventListener('click', handleVolumeDrag);

    // --- (RELIABLE) PROGRESS & SEEKING LOGIC ---
    const handleSeek = (e) => {
        if (!isFinite(audio.duration)) return; // Don't seek if duration is not available
        const rect = progressControl.getBoundingClientRect();
        const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        audio.currentTime = percent * audio.duration;
        // Immediately update the visual progress
        progressBar.style.width = `${percent * 100}%`;
        currentTimeEl.textContent = formatTime(audio.currentTime);
    };

    progressControl.addEventListener('mousedown', (e) => {
        isSeeking = true; // Set seeking flag
        handleSeek(e); // Seek to the clicked position
    });

    document.addEventListener('mousemove', (e) => {
        if (isSeeking) {
            handleSeek(e); // Continue seeking while mouse is moving
        }
    });

    document.addEventListener('mouseup', () => {
        isSeeking = false; // Clear seeking flag
    });

    // --- INITIALIZATION ---
    window.initializeMusicPage = initializeMusicPage;
});
