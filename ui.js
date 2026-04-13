const GameUI = {
    updateDisplay: (coins, pHP, eHP, pATB, eATB, partner) => {
        document.getElementById('coin-display').innerText = coins;
        document.getElementById('player-hp-text').innerText = `${Math.ceil(pHP)} / 100`;
        document.getElementById('enemy-hp-text').innerText = `${Math.ceil(eHP)} / 100`;
        document.getElementById('player-hp-bar-real').style.width = pHP + '%';
        document.getElementById('enemy-hp-bar').style.width = eHP + '%';
        document.getElementById('player-racer').style.left = pATB + '%';
        document.getElementById('enemy-racer').style.left = eATB + '%';
        if(partner) {
            document.getElementById('player-icon').src = partner.image;
            document.getElementById('player-racer-img').src = partner.image;
        }
    },
    showDamage: (id, amt) => {
        const card = document.getElementById(id); const rect = card.getBoundingClientRect();
        const d = document.createElement('div'); d.className = 'damage-popup'; d.innerText = `-${amt}`;
        d.style.left = (rect.left + 80) + 'px'; d.style.top = (rect.top + 80) + 'px';
        document.body.appendChild(d); setTimeout(() => d.remove(), 800);
    },
    shake: (id) => {
        const el = document.getElementById(id); el.classList.add('shake');
        setTimeout(() => el.classList.remove('shake'), 400);
    },
    renderCarousel: (idx, options) => {
        const data = options[idx];
        document.getElementById('single-map-display').innerHTML = `
            <div class="map-card ${data.rarity >= 6 ? 'rarity-6' : ''}">
                <img src="${data.image}" class="poke-sprite ${data.rarity >= 4 ? 'silhouette' : ''}">
                <h3 style="margin:10px 0;">區域 ${idx + 1}</h3>
                <p style="color:#aaa; margin:0;">${data.name} (★${data.rarity})</p>
            </div>`;
    }
};
