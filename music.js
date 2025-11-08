document.addEventListener('DOMContentLoaded', () => {
    const musicPage = document.getElementById('music-page');
    if (!musicPage) return;

    // --- VISUALIZER & AUDIO API ELEMENTS ---
    const canvas = document.getElementById('background-visualizer');
    const ctx = canvas.getContext('2d');
    let audioContext;
    let analyser;
    let source;
    let dataArray;
    let animationFrameId;

    // --- DOM ELEMENTS ---
    const panelContent = musicPage.querySelector('.panel-content');
    const trackList = musicPage.querySelector('.track-list');
    const albumList = musicPage.querySelector('.album-list');
    const audio = new Audio();
    audio.crossOrigin = "anonymous";

    const trackImgPlayer = musicPage.querySelector('.track-img-player');
    const trackTitlePlayer = musicPage.querySelector('.track-title-player');
    const trackArtistPlayer = musicPage.querySelector('.track-artist-player');
    const playBtn = musicPage.querySelector('.play-btn');
    const prevBtn = musicPage.querySelector('.prev-btn');
    const nextBtn = musicPage.querySelector('.next-btn');
    const repeatBtn = musicPage.querySelector('.repeat-btn');
    const shuffleBtn = musicPage.querySelector('.shuffle-btn');
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
    let originalPlaylistForShuffle = [];
    let currentPlaylistName = 'popular';
    let isPlaying = false;
    let musicLoaded = false;
    let isSeeking = false;
    let visualizerInitialized = false;
    let isRepeat = false;
    let isShuffle = false;

    // --- VISUALIZER LOGIC ---
    function setupVisualizer() {
        if (visualizerInitialized) return;
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            source = audioContext.createMediaElementSource(audio);
            source.connect(analyser);
            analyser.connect(audioContext.destination);
            analyser.fftSize = 256;
            const bufferLength = analyser.frequencyBinCount;
            dataArray = new Uint8Array(bufferLength);
            visualizerInitialized = true;
        } catch (e) {
            console.error('Could not initialize AudioContext:', e);
        }
    }

    let blobs = [];
    function initBlobs() {
        blobs = [
            { x: 0.2, y: 0.4, r: 0.2, vx: 0.0003, vy: -0.0004, color: 'rgba(255, 221, 89, 0.9)', band: 'bass' },
            { x: 0.8, y: 0.6, r: 0.25, vx: -0.0004, vy: 0.0005, color: 'rgba(155, 89, 182, 0.95)', band: 'mid' },
            { x: 0.5, y: 0.5, r: 0.3, vx: 0.0005, vy: 0.0003, color: 'rgba(255, 130, 0, 0.9)', band: 'high' },
            { x: 0.3, y: 0.7, r: 0.15, vx: -0.0006, vy: -0.0003, color: 'rgba(89, 182, 155, 0.9)', band: 'mid' },
        ];
    }

    function renderFrame() {
        if (!analyser) return;
        animationFrameId = requestAnimationFrame(renderFrame);
        analyser.getByteFrequencyData(dataArray);
        let bassAvg = 0, midAvg = 0, highAvg = 0;
        if (isPlaying) {
            bassAvg = (dataArray[1] + dataArray[2] + dataArray[3]) / 3 / 255;
            midAvg = (dataArray[40] + dataArray[50] + dataArray[60]) / 3 / 255;
            highAvg = (dataArray[100] + dataArray[110] + dataArray[120]) / 3 / 255;
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.filter = 'blur(50px)';
        blobs.forEach(blob => {
            blob.x += blob.vx;
            blob.y += blob.vy;
            if (blob.x < blob.r * 0.5 || blob.x > 1 - blob.r * 0.5) blob.vx *= -1;
            if (blob.y < blob.r * 0.5 || blob.y > 1 - blob.r * 0.5) blob.vy *= -1;
            let targetRadius;
            if (isPlaying) {
                 switch(blob.band) {
                    case 'bass': targetRadius = 0.2 + bassAvg * 0.4; break;
                    case 'mid': targetRadius = 0.25 + midAvg * 0.5; break;
                    case 'high': targetRadius = 0.15 + highAvg * 0.3; break;
                    default: targetRadius = 0.2;
                }
            } else {
                targetRadius = blob.r;
            }
            blob.r += (targetRadius - blob.r) * (isPlaying ? 0.08 : 0.01);
            ctx.beginPath();
            const gradient = ctx.createRadialGradient(blob.x * canvas.width, blob.y * canvas.height, 0, blob.x * canvas.width, blob.y * canvas.height, blob.r * canvas.width);
            gradient.addColorStop(0, blob.color);
            gradient.addColorStop(1, 'transparent');
            ctx.fillStyle = gradient;
            ctx.arc(blob.x * canvas.width, blob.y * canvas.height, blob.r * canvas.width, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    function startVisualizer() {
        if (!visualizerInitialized) setupVisualizer();
        if (audioContext && audioContext.state === 'suspended') audioContext.resume();
        if (!animationFrameId) renderFrame();
    }

    function resizeCanvas() {
        const container = musicPage.querySelector('.music-left-panel');
        if(container) {
            canvas.width = container.clientWidth;
            canvas.height = container.clientHeight;
            initBlobs();
        }
    }

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
            resizeCanvas();
            startVisualizer();
        } catch (error) {
            console.error('Could not initialize music page:', error);
            panelContent.innerHTML = `<p>Error loading music data.</p>`;
        }
    }

    window.pauseMusic = () => { if (isPlaying) audio.pause(); };

    function playTrack(trackIndex, playlistId) {
        if (!visualizerInitialized) setupVisualizer();
        
        const newPlaylist = setupPlaylist(playlistId);
        if (currentPlaylistName !== playlistId) {
            currentPlaylistName = playlistId;
            currentPlaylist = newPlaylist;
            originalPlaylistForShuffle = [...newPlaylist];
             if (isShuffle) {
                const currentTrack = currentPlaylist[trackIndex];
                currentPlaylist = currentPlaylist.filter(t => t.url !== currentTrack.url);
                currentPlaylist.sort(() => Math.random() - 0.5);
                currentPlaylist.unshift(currentTrack);
                trackIndex = 0;
            }
        }

        if (trackIndex < 0 || trackIndex >= currentPlaylist.length) return;
        
        currentTrackIndex = trackIndex;
        const track = currentPlaylist[trackIndex];
        
        audio.src = track.url;
        updatePlayerUI(track);
        updateActiveTracklist();

        const playPromise = audio.play();
        if (playPromise) playPromise.catch(e => console.error("Playback error:", e));
    }

    // --- UI UPDATES ---
    function renderMusicPage() {
        const popularTracks = getPopularTracks();
        trackList.innerHTML = popularTracks.map((track, displayIndex) => createTrackItemHTML(track, displayIndex, 'popular')).join('');
        currentPlaylist = popularTracks;
        originalPlaylistForShuffle = [...popularTracks];
        if (popularTracks.length > 0) updatePlayerUI(popularTracks[0]);
        albumList.innerHTML = musicData.albums.map(createAlbumItemHTML).join('');
    }

    function updatePlayerUI(track) {
        if (!track) return;
        trackImgPlayer.src = track.image;
        trackTitlePlayer.textContent = track.title;
        trackArtistPlayer.textContent = track.artist;
    }

    function updateProgress() {
        if (isSeeking || !isFinite(audio.duration)) return;
        const progressPercent = (audio.currentTime / audio.duration) * 100;
        progressBar.style.width = `${progressPercent}%`;
        currentTimeEl.textContent = formatTime(audio.currentTime);
        totalTimeEl.textContent = formatTime(audio.duration);
    }

    function updateActiveTracklist() {
        const currentTrackUrl = currentPlaylist[currentTrackIndex]?.url;
        if (!currentTrackUrl) return;
        document.querySelectorAll('#music-page .track-item').forEach(item => {
            const itemPlaylist = setupPlaylist(item.dataset.playlist);
            const itemTrack = itemPlaylist[parseInt(item.dataset.trackIndex)];
            if(itemTrack && itemTrack.url === currentTrackUrl) {
                 item.classList.add('active');
            } else {
                 item.classList.remove('active');
            }
        });
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
                return { ...track, artist: album.artist, image: album.cover, albumTitle: album.title, albumId: album.id };
            }).filter(Boolean);
    }

    function setupPlaylist(playlistId) {
        if (playlistId === 'popular') return getPopularTracks();
        const album = musicData.albums.find(a => a.id === playlistId);
        if (!album) return [];
        return album.tracks.map(track => ({ ...track, artist: album.artist, image: album.cover, albumTitle: album.title, albumId: album.id }));
    }

    // --- HTML TEMPLATES ---
    function createTrackItemHTML(track, index, playlistId) {
        return `
            <div class="track-item" data-track-index="${index}" data-playlist="${playlistId}">
                <div class="track-item-left">
                    <span class="track-number">${index + 1}</span>
                    <img src="${track.image}" alt="${track.title}" class="track-img">
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
            if (currentPlaylist.length > 0) playTrack(0, currentPlaylistName);
            return;
        }
        isPlaying ? audio.pause() : audio.play();
    }

    function playNext() {
        let nextIndex;
        if (isShuffle) {
            if (currentPlaylist.length < 2) {
                nextIndex = 0;
            } else {
                do {
                    nextIndex = Math.floor(Math.random() * currentPlaylist.length);
                } while (nextIndex === currentTrackIndex);
            }
        } else {
            nextIndex = (currentTrackIndex + 1) % currentPlaylist.length;
        }
        playTrack(nextIndex, currentPlaylistName);
    }

    function playPrev() {
        let prevIndex;
        if (isShuffle) {
            if (currentPlaylist.length < 2) {
                prevIndex = 0;
            } else {
                do {
                    prevIndex = Math.floor(Math.random() * currentPlaylist.length);
                } while (prevIndex === currentTrackIndex);
            }
        } else {
            prevIndex = (currentTrackIndex - 1 + currentPlaylist.length) % currentPlaylist.length;
        }
        playTrack(prevIndex, currentPlaylistName);
    }

    function toggleRepeat() {
        isRepeat = !isRepeat;
        audio.loop = isRepeat;
        repeatBtn.classList.toggle('active', isRepeat);
    }

    function toggleShuffle() {
        isShuffle = !isShuffle;
        shuffleBtn.classList.toggle('active', isShuffle);
        if (isShuffle) {
            const currentTrack = currentPlaylist[currentTrackIndex];
            // Filter out the current track, shuffle the rest and add the current track to the beginning
            currentPlaylist = currentPlaylist.filter(t => t.url !== currentTrack.url);
            currentPlaylist.sort(() => Math.random() - 0.5);
            currentPlaylist.unshift(currentTrack);
            currentTrackIndex = 0;
        } else {
            // Restore the original playlist order
            const currentTrackUrl = currentPlaylist[currentTrackIndex].url;
            currentPlaylist = [...originalPlaylistForShuffle];
            currentTrackIndex = currentPlaylist.findIndex(t => t.url === currentTrackUrl);
             if (currentTrackIndex === -1) currentTrackIndex = 0;
        }
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
    window.addEventListener('resize', resizeCanvas);
    audio.addEventListener('play', () => {
        isPlaying = true;
        playBtn.querySelector('img').src = 'images/pause.svg';
        startVisualizer();
    });
    audio.addEventListener('pause', () => {
        isPlaying = false;
        playBtn.querySelector('img').src = 'images/play.svg';
    });
    audio.addEventListener('loadedmetadata', () => { totalTimeEl.textContent = formatTime(audio.duration); });
    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', () => { if (!audio.loop) playNext(); });

    playBtn.addEventListener('click', togglePlayPause);
    nextBtn.addEventListener('click', playNext);
    prevBtn.addEventListener('click', playPrev);
    repeatBtn.addEventListener('click', toggleRepeat);
    shuffleBtn.addEventListener('click', toggleShuffle);

    [trackList, document.body].forEach(element => {
        element.addEventListener('click', (e) => {
            const trackItem = e.target.closest('.track-item');
            if (trackItem && trackItem.closest('#music-page')) {
                 const playlistId = trackItem.dataset.playlist;
                 const trackIndex = parseInt(trackItem.dataset.trackIndex, 10);
                 playTrack(trackIndex, playlistId);
                 const modal = e.target.closest('.album-modal');
                 if(modal) document.body.removeChild(modal);
            }
        });
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
                        <button class="play-album-btn" data-album-id="${album.id}">
                            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                            Play Album
                        </button>
                    </div>
                </div>
                <div class="album-modal-tracklist">
                    ${album.tracks.map((track, index) => createTrackItemHTML({ ...track, artist: album.artist, image: album.cover }, index, album.id)).join('')}
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.addEventListener('click', (e) => {
            if (e.target.classList.contains('album-modal') || e.target.closest('.close-album-modal')) {
                document.body.removeChild(modal);
            }
        });
        modal.querySelector('.play-album-btn').addEventListener('click', () => {
            playTrack(0, album.id);
            document.body.removeChild(modal);
        });
    }

    const handleVolumeDrag = (e) => {
        const rect = volumeControl.getBoundingClientRect();
        const volume = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        setVolume(volume);
    };
    volumeControl.addEventListener('mousedown', (e) => {
        handleVolumeDrag(e);
        document.addEventListener('mousemove', handleVolumeDrag);
        document.addEventListener('mouseup', () => {
            document.removeEventListener('mousemove', handleVolumeDrag);
        }, { once: true });
    });

    const handleSeek = (e) => {
        if (!isFinite(audio.duration)) return;
        const rect = progressControl.getBoundingClientRect();
        const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        audio.currentTime = percent * audio.duration;
        updateProgress();
    };
    progressControl.addEventListener('mousedown', (e) => {
        isSeeking = true;
        handleSeek(e);
        document.addEventListener('mousemove', handleSeek);
        document.addEventListener('mouseup', () => {
            isSeeking = false;
            document.removeEventListener('mousemove', handleSeek);
        }, { once: true });
    });

    // --- INITIALIZATION ---
    window.initializeMusicPage = initializeMusicPage;
});
