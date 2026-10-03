(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const background = document.querySelector("#hero-video");
    const motionToggle = document.querySelector(".motion-toggle");
    let backgroundRequested = !reducedMotion.matches;
    let heroVisible = true;
    let modalOpen = false;
    const updateMotionButton = () => {
        const playing = !background.paused;
        motionToggle.setAttribute("aria-pressed", String(playing));
        motionToggle.setAttribute("aria-label", playing ? "Pause background video" : "Play background video");
        motionToggle.firstElementChild.textContent = playing ? "Ⅱ" : "▶";
    };
    const syncBackground = () => {
        if (backgroundRequested && heroVisible && !document.hidden && !modalOpen) background.play().catch(updateMotionButton);
        else background.pause();
    };
    background.addEventListener("play", updateMotionButton);
    background.addEventListener("pause", updateMotionButton);
    motionToggle.addEventListener("click", () => {
        backgroundRequested = !backgroundRequested;
        syncBackground();
    });
    new IntersectionObserver(([entry]) => {
        heroVisible = entry.isIntersecting;
        syncBackground();
    }, { threshold: 0.1 }).observe(document.querySelector(".hero"));
    document.addEventListener("visibilitychange", syncBackground);
    reducedMotion.addEventListener("change", () => {
        backgroundRequested = !reducedMotion.matches;
        syncBackground();
    });
    const tabs = [...document.querySelectorAll("[data-tab]")];
    const selectTab = tab => {
        tabs.forEach(item => {
            const selected = item === tab;
            item.setAttribute("aria-selected", String(selected));
            item.tabIndex = selected ? 0 : -1;
            document.getElementById(item.getAttribute("aria-controls")).hidden = !selected;
        });
    };
    tabs.forEach((tab, index) => {
        tab.addEventListener("click", () => selectTab(tab));
        tab.addEventListener("keydown", event => {
            let next;
            if (event.key === "ArrowRight") next = tabs[(index + 1) % tabs.length];
            if (event.key === "ArrowLeft") next = tabs[(index + tabs.length - 1) % tabs.length];
            if (event.key === "Home") next = tabs[0];
            if (event.key === "End") next = tabs[tabs.length - 1];
            if (next) {
                event.preventDefault();
                selectTab(next);
                next.focus();
                next.scrollIntoView({ block: "nearest", inline: "nearest" });
            }
        });
    });
    const dialog = document.getElementById("media-dialog");
    const dialogContent = dialog.querySelector(".media-dialog-content");
    const openMedia = (source, type, title) => {
        const media = document.createElement(type === "video" ? "video" : "img");
        media.src = source;
        if (type === "video") {
            media.controls = true;
            media.playsInline = true;
            media.muted = true;
        } else media.alt = title;
        dialogContent.replaceChildren(media);
        document.getElementById("media-dialog-title").textContent = title;
        modalOpen = true;
        syncBackground();
        dialog.showModal();
        document.body.style.overflow = "hidden";
        if (type === "video") media.play().catch(() => {});
    };
    document.querySelectorAll("[data-play-film]").forEach(button => button.addEventListener("click", () => openMedia(dialog.dataset.filmSource, "video", "Made with Nox")));
    document.querySelectorAll("[data-lightbox]").forEach(link => link.addEventListener("click", event => {
        event.preventDefault();
        openMedia(link.href, link.dataset.mediaType, link.dataset.mediaTitle);
    }));
    dialog.querySelector(".dialog-close").addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", event => {
        const bounds = dialog.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
    });
    dialog.addEventListener("close", () => {
        dialogContent.querySelector("video")?.pause();
        dialogContent.replaceChildren();
        modalOpen = false;
        document.body.style.overflow = "";
        syncBackground();
    });
    syncBackground();
})();
