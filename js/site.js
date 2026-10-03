(() => {
    const menuButton = document.querySelector(".nav-toggle");
    const navigation = document.querySelector(".site-navigation");
    const closeMenu = () => {
        navigation.classList.remove("is-open");
        menuButton.setAttribute("aria-expanded", "false");
        menuButton.lastElementChild.textContent = "+";
    };
    menuButton.addEventListener("click", () => {
        const open = navigation.classList.toggle("is-open");
        menuButton.setAttribute("aria-expanded", String(open));
        menuButton.lastElementChild.textContent = open ? "−" : "+";
    });
    navigation.querySelectorAll("a").forEach(link => link.addEventListener("click", closeMenu));
    document.addEventListener("keydown", event => {
        if (event.key === "Escape" && navigation.classList.contains("is-open")) {
            closeMenu();
            menuButton.focus();
        }
    });
    window.matchMedia("(min-width: 761px)").addEventListener("change", closeMenu);
})();
