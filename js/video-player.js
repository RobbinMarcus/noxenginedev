(() => {
    const players = document.querySelectorAll(".video-player video");

    document.querySelectorAll(".video-player").forEach((root) => {
        const video = root.querySelector("video");
        const select = root.querySelector("select");
        const status = root.querySelector(".video-player-status");
        let revision = 0;

        select.disabled = false;
        select.addEventListener("change", () => {
            const option = select.selectedOptions[0];
            const wasPlaying = !video.paused && !video.ended;
            const currentRevision = ++revision;
            video.pause();
            status.hidden = true;
            video.poster = option.dataset.poster;
            video.src = option.dataset.src;
            video.setAttribute("aria-label", `${option.text}: ${video.dataset.alt}`);
            video.load();
            if (wasPlaying) {
                video.play().catch(() => {
                    if (currentRevision !== revision) return;
                    status.textContent = "Press Play to start the selected video.";
                    status.hidden = false;
                });
            }
        });

        video.addEventListener("play", () => {
            status.hidden = true;
            players.forEach((other) => {
                if (other !== video) other.pause();
            });
        });
        video.addEventListener("error", () => {
            status.textContent = "This video could not be loaded. Try another checkpoint.";
            status.hidden = false;
        });
    });
})();
