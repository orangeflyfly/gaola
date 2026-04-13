// ui.js - V6.0 橫式卡匣與 UI 強化版
const GameUI = {
    // 1. 更新主畫面顯示 (血條與賽道)
    updateDisplay: function(coins, pHP, eHP, pATB, eATB, partner) {
        document.getElementById('coin-display').innerText = coins;
        
        // 更新血條百分比
        document.getElementById('player-hp-bar-real').style.width = pHP + '%';
        document.getElementById('enemy-hp-bar').style.width = eHP + '%';
        
        // 更新血量文字
        document.getElementById('player-hp-text').innerText = `${Math.ceil(pHP)} / 100`;
        document.getElementById('enemy-hp-text').innerText = `${Math.ceil(eHP)} / 100`;
        
        // 更新賽道位置 (配合加長版賽道)
        document.getElementById('player-racer').style.left = pATB + '%';
        document.getElementById('enemy-racer').style.left = enemyATB + '%';
        
        // 更新戰鬥卡片名稱
        if(partner) document.getElementById('player-name').innerText = partner.name;
    },

    // 2. 橫式卡匣渲染 (大廳與地圖)
    renderCarousel: function(idx, options) {
        const data = options[idx];
        const display = document.getElementById('single-map-display');
        
        // 配合 CSS 的橫式 flex 佈局
        display.innerHTML = `
            <div class="map-card ${data.rarity >= 6 ? 'rarity-6' : ''}">
                <img src="${data.image}" class="poke-sprite ${data.rarity >= 4 ? 'silhouette' : ''}">
                <div class="card-info">
                    <div style="font-size: 14px; color: #ffeb3b;">REGION 0${idx + 1}</div>
                    <div style="font-size: 22px; font-weight: bold; margin: 5px 0;">${data.name}</div>
                    <div style="font-size: 18px; color: #aaa;">★ ${data.rarity}</div>
                </div>
            </div>`;
    },

    // 3. 傷害噴字特效
    showDamage: function(id, amt) {
        const card = document.getElementById(id);
        const rect = card.getBoundingClientRect();
        const d = document.createElement('div');
        d.className = 'damage-popup';
        d.innerText = `-${amt}`;
        // 配合橫式卡匣調整座標，讓字噴在中間
        d.style.left = (rect.left + 150) + 'px'; 
        d.style.top = (rect.top + 20) + 'px';
        document.body.appendChild(d);
        setTimeout(() => d.remove(), 800);
    },

    // 4. 卡片震動
    shake: function(id) {
        const el = document.getElementById(id);
        el.classList.add('shake');
        setTimeout(() => el.classList.remove('shake'), 400);
    }
};
