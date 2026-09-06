/**
 * Pet Avatar Controller (Dog / Cat Toggle & Context Menu)
 * Supports right-click context menu "i like cats instead" / "i like dogs instead"
 * Links to /dog and /cat
 */
(function () {
    'use strict';

    const DOG_IMG = '/backtrack/dog-avatar.png';
    const CAT_IMG = '/backtrack/cat-avatar.png';
    const DOG_URL = 'https://ilyambr.com/dog';
    const CAT_URL = 'https://ilyambr.com/cat';

    function initPetAvatar() {
        const anchor = document.querySelector('.dog-avatar-anchor');
        if (!anchor) return;

        let img = anchor.querySelector('img');
        if (!img) {
            img = document.createElement('img');
            anchor.appendChild(img);
        }

        // Create or get context menu container
        let menu = document.getElementById('pet-context-menu');
        if (!menu) {
            menu = document.createElement('div');
            menu.id = 'pet-context-menu';
            menu.className = 'pet-context-menu';
            document.body.appendChild(menu);
        }

        function setPet(type) {
            anchor.setAttribute('target', '_blank');
            anchor.setAttribute('rel', 'noopener');
            if (type === 'cat') {
                img.src = CAT_IMG;
                img.alt = 'Cat Avatar';
                anchor.href = CAT_URL;
                anchor.title = 'ilyambr.com/cat';
                anchor.setAttribute('aria-label', 'Cat Avatar (ilyambr.com/cat)');
                anchor.classList.add('is-cat');
                localStorage.setItem('pet_preference', 'cat');
            } else {
                img.src = DOG_IMG;
                img.alt = 'Dog Avatar';
                anchor.href = DOG_URL;
                anchor.title = 'ilyambr.com/dog';
                anchor.setAttribute('aria-label', 'Dog Avatar (ilyambr.com/dog)');
                anchor.classList.remove('is-cat');
                localStorage.setItem('pet_preference', 'dog');
            }
        }

        // Restore saved preference (default: dog)
        const saved = localStorage.getItem('pet_preference') || 'dog';
        setPet(saved);

        function renderMenu(currentPet) {
            const label = currentPet === 'cat' ? 'i like dogs instead' : 'i like cats instead';
            menu.innerHTML = `<button type="button" class="pet-context-item" id="toggle-pet-btn">${label}</button>`;

            const btn = document.getElementById('toggle-pet-btn');
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                const nextPet = (localStorage.getItem('pet_preference') === 'cat') ? 'dog' : 'cat';
                setPet(nextPet);
                hideMenu();
            });
        }

        function showMenu(x, y) {
            const currentPet = localStorage.getItem('pet_preference') || 'dog';
            renderMenu(currentPet);

            menu.classList.add('active');
            const menuRect = menu.getBoundingClientRect();

            let posX = x - menuRect.width;
            let posY = y - menuRect.height - 8;

            if (posX < 10) posX = 10;
            if (posY < 10) posY = y + 10;

            menu.style.left = `${posX}px`;
            menu.style.top = `${posY}px`;
        }

        function hideMenu() {
            menu.classList.remove('active');
        }

        // Right-click context menu on avatar
        anchor.addEventListener('contextmenu', function (e) {
            e.preventDefault();
            e.stopPropagation();
            showMenu(e.clientX, e.clientY);
        });

        // Close on click outside or escape key
        document.addEventListener('click', function (e) {
            if (!menu.contains(e.target)) {
                hideMenu();
            }
        });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                hideMenu();
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPetAvatar);
    } else {
        initPetAvatar();
    }
})();
