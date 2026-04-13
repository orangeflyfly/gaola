// ui.js - V6.2.7 旗艦對接校正版 (不簡化原本邏輯)
const GameUI = {
    // 1. 更新主畫面顯示 (血條與賽道)
    updateDisplay: function(coins, pHP, eHP, pATB, eATB, partner) {
        // [修正] ID 從 coin-display 改為 coin-count
        const coinEl = document.getElementById('coin-count');
        if(coinEl) coinEl.innerText = coins;
        
        // 更新血條百分比
        const pBar = document.getElementById('player-hp-bar-real');
        const eBar = document.getElementById('enemy-hp-bar');
        if(pBar) pBar.style.width = pHP + '%';
        if(eBar) eBar.style.width = eHP + '%';
        
        // 更新血量文字
        const pText = document.getElementById('player-hp-text');
        const eText = document.getElementById('enemy-hp-text');
        if(pText) pText.innerText = `${Math.ceil(pHP)} / 100`;
        if(eText) eText.innerText = `${Math.ceil(eHP)} / 100`;
        
        // 更新賽道位置 (配合加長版賽道)
        const pRacer = document.getElementById('player-racer');
        const eRacer = document.getElementById('enemy-racer');
        if(pRacer) pRacer.style.left = pATB + '%';
        // [修正] 變數名稱從 enemyATB 改為 eATB
        if(eRacer) eRacer.style.left = eATB + '%';
        
        // 更新戰鬥卡片名稱
        const pName = document.getElementById('player-name');
        if(partner && pName) pName.innerText = partner.name;
    },

    // 2. 橫式卡匣渲染 (大廳與地圖)
    renderCarousel: function(idx, options) {
        const data = options[idx];
        const display = document.getElementById('single-map-display');
        if(!display || !data) return;

        // 配合 CSS 的橫式佈局，移除可能導致破圖的舊邏輯，改用傳入的 image
        display.innerHTML = `
            <div class="map-card ${data.rarity >= 6 ? 'rarity-6' : ''}">
                <img src="${data.image}" class="poke-sprite">
                <div class="card-info">
                    <div style="font-size: 14px; color: #ffeb3b;">REGION 0${idx + 1}</div>
                    <div style="font-size: 26px; font-weight: bold; margin: 5px 0;">${data.name}</div>
                    <div style="font-size: 18px; color: #aaa;">★ ${data.rarity}</div>
                </div>
            </div>`;
    },

    // 3. 傷害噴字特效
    showDamage: function(id, amt) {
        const card = document.getElementById(id);
        if(!card) return;
        const rect = card.getBoundingClientRect();
        const d = document.createElement('div');
        d.className = 'damage-popup';
        d.innerText = `-${amt}`;
        // 配合巨大化橫式卡匣調整座標
        d.style.left = (rect.left + rect.width / 2) + 'px'; 
        d.style.top = (rect.top) + 'px';
        document.body.appendChild(d);
        setTimeout(() => d.remove(), 800);
    },

    // 4. 卡片震動
    shake: function(id) {
        const el = document.getElementById(id);
        if(el) {
            el.classList.add('shake');
            setTimeout(() => el.classList.remove('shake'), 400);
        }
    }
};
