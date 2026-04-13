// ui.js - 負責所有畫面渲染與特效
const GameUI = {
    updateDisplay: function(coins, playerHP, enemyHP, playerATB, enemyATB, partner, enemy) {
        document.getElementById('coin-display').innerText = coins;
        document.getElementById('player-hp-text').innerText = `${Math.ceil(playerHP)} / ${GAME_CONFIG.PLAYER_MAX_HP}`;
        document.getElementById('enemy-hp-text').innerText = `${Math.ceil(enemyHP)} / ${GAME_CONFIG.ENEMY_MAX_HP}`;
        document.getElementById('player-hp-bar-real').style.width = playerHP + '%';
        document.getElementById('enemy-hp-bar').style.width = enemyHP + '%';
        
        if (partner) {
            document.getElementById('player-icon').src = partner.image;
            document.getElementById('player-racer-img').src = partner.image;
            document.getElementById('player-name').innerText = partner.name;
        }
        
        document.getElementById('player-racer').style.left = playerATB + '%';
        document.getElementById('enemy-racer').style.left = enemyATB + '%';
    },

    showDamage: function(targetId, amount) {
        const card = document.getElementById(targetId);
        const rect = card.getBoundingClientRect();
        const d = document.createElement('div');
        d.className = 'damage-popup';
        d.innerText = `-${amount}`;
        d.style.left = rect.left + 80 + 'px';
        d.style.top = rect.top + 80 + 'px';
        document.body.appendChild(d);
        setTimeout(() => d.remove(), 800);
    },

    shake: function(targetId) {
        const el = document.getElementById(targetId);
        el.classList.add('shake');
        setTimeout(() => el.classList.remove('shake'), 400);
    },

    renderCarousel: function(index, mapOptions) {
        const data = mapOptions[index];
        document.getElementById('single-map-display').innerHTML = `
            <div class="map-card ${data.rarity >= 6 ? 'rarity-6' : ''}">
                <img src="${data.image}" class="poke-sprite ${data.rarity >= 4 ? 'silhouette' : ''}">
                <div style="font-size: 20px; font-weight: bold; margin-top:10px;">地圖區域 ${index + 1}</div>
                <div style="color: #aaa;">${data.name} (★${data.rarity})</div>
            </div>`;
    }
};
