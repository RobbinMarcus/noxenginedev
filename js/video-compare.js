// Keeps the two videos of each .video-compare slider on the same frame.
// The first video is the clock; the second follows it.
(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function setup(root) {
        const [lead, follow] = root.querySelectorAll("video");
        const playButton = root.querySelector(".video-compare-play");
        const scrub = root.querySelector(".video-compare-scrub");
        const frameLabel = root.querySelector(".video-compare-frame");
        const fps = Number(root.dataset.fps) || 24;
        const frameTime = (frame) => (frame + 0.5) / fps;
        let frameCount = 0;

        const currentFrame = () => Math.min(Math.max(Math.floor(lead.currentTime * fps), 0), Math.max(frameCount - 1, 0));

        function showFrame() {
            const frame = currentFrame();
            scrub.value = frame;
            frameLabel.textContent = `Frame ${frame}`;
        }

        function setPlaying(playing) {
            playButton.textContent = playing ? "Pause" : "Play";
            playButton.setAttribute("aria-label", playing ? "Pause" : "Play");
        }

        function seek(frame) {
            frame = Math.min(Math.max(frame, 0), frameCount - 1);
            follow.playbackRate = 1;
            lead.currentTime = frameTime(frame);
            follow.currentTime = frameTime(frame);
            showFrame();
        }

        function pause() {
            lead.pause();
            follow.pause();
            seek(currentFrame());
            setPlaying(false);
        }

        function play() {
            if (lead.ended || currentFrame() >= frameCount - 1) seek(0);
            follow.currentTime = lead.currentTime;
            Promise.all([lead.play(), follow.play()]).catch(() => pause());
            setPlaying(true);
        }

        function sync() {
            if (!lead.paused && !follow.seeking) {
                // Seeking is expensive (videos may have a single keyframe), so small drift is
                // corrected by nudging the playback rate and only large jumps seek.
                const drift = follow.currentTime - lead.currentTime;
                if (Math.abs(drift) > 0.25) {
                    follow.playbackRate = 1;
                    follow.currentTime = lead.currentTime;
                } else if (Math.abs(drift) > 0.5 / fps) {
                    follow.playbackRate = Math.min(Math.max(1 - drift * 2, 0.9), 1.1);
                } else {
                    follow.playbackRate = 1;
                }
            }
            if (!lead.paused) showFrame();
            if ("requestVideoFrameCallback" in lead) lead.requestVideoFrameCallback(sync);
        }

        function readMetadata() {
            frameCount = Math.round(lead.duration * fps);
            scrub.max = frameCount - 1;
            showFrame();
        }
        // Metadata may already be loaded (e.g. from cache) before this script runs.
        if (lead.readyState >= HTMLMediaElement.HAVE_METADATA) readMetadata();
        else lead.addEventListener("loadedmetadata", readMetadata);
        lead.addEventListener("ended", () => {
            // Loop both videos together instead of letting each loop on its own.
            seek(0);
            play();
        });
        if ("requestVideoFrameCallback" in lead) lead.requestVideoFrameCallback(sync);
        else lead.addEventListener("timeupdate", sync);

        playButton.addEventListener("click", () => (lead.paused ? play() : pause()));
        root.querySelectorAll(".video-compare-step").forEach((button) => {
            button.addEventListener("click", () => {
                pause();
                seek(currentFrame() + Number(button.dataset.step));
            });
        });
        scrub.addEventListener("input", () => {
            if (!lead.paused) pause();
            seek(Number(scrub.value));
        });

        if (reducedMotion || !("IntersectionObserver" in window)) return;
        // Autoplay while visible; never resume a video the reader paused.
        let userPaused = false;
        playButton.addEventListener("click", () => (userPaused = lead.paused));
        scrub.addEventListener("input", () => (userPaused = true));
        new IntersectionObserver((entries) => {
            for (const entry of entries) {
                if (entry.isIntersecting && lead.paused && !userPaused) {
                    lead.preload = follow.preload = "auto";
                    play();
                } else if (!entry.isIntersecting && !lead.paused) {
                    lead.pause();
                    follow.pause();
                    setPlaying(false);
                }
            }
        }, { threshold: 0.5 }).observe(root);
    }

    document.querySelectorAll(".video-compare").forEach(setup);
})();
