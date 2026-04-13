// ui.js - V7.0 屬性覺醒對接版 (全代碼不簡化)
const GameUI = {
    // 1. 更新主畫面顯示 (新增 partner 與 enemy 屬性對接)
    updateDisplay: function(coins, pHP, eHP, pATB, eATB, partner, enemy) {
        // 金幣更新
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
        
        // 更新賽道位置
        const pRacer = document.getElementById('player-racer');
        const eRacer = document.getElementById('enemy-racer');
        if(pRacer) pRacer.style.left = pATB + '%';
        if(eRacer) eRacer.style.left = eATB + '%';
        
        // [新增 V7.0] 更新屬性標籤
        this.updateTypeTag('player-type', partner ? partner.type : '一般');
        this.updateTypeTag('enemy-type', enemy ? enemy.type : '一般');
        
        // 更新戰鬥卡片名稱
        const pName = document.getElementById('player-name');
        if(partner && pName) pName.innerText = partner.name;
    },

    // [新增 V7.0] 專門處理屬性標籤的渲染與顏色切換
    updateTypeTag: function(elementId, typeName) {
        const el = document.getElementById(elementId);
        if(!el) return;
        el.innerText = typeName;
        // 重置類別並根據屬性套用配色
        el.className = 'type-tag'; 
        const typeClassMap = { 
            "火": "type-fire", 
            "水": "type-water", 
            "草": "type-grass", 
            "電": "type-electric",
            "一般": "type-normal"
        };
        if(typeClassMap[typeName]) el.classList.add(typeClassMap[typeName]);
    },

    // 2. 橫式卡匣渲染 (大廳與地圖，新增屬性顯示)
    renderCarousel: function(idx, options) {
        const data = options[idx];
        const display = document.getElementById('single-map-display');
        if(!display || !data) return;

        display.innerHTML = `
            <div class="map-card ${data.rarity >= 6 ? 'rarity-6' : ''}">
                <img src="${data.image}" class="poke-sprite">
                <div class="card-info">
                    <div style="font-size: 14px; color: #ffeb3b;">REGION 0${idx + 1}</div>
                    <div style="font-size: 26px; font-weight: bold; margin: 5px 0;">${data.name}</div>
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <span style="font-size: 18px; color: #aaa;">★ ${data.rarity}</span>
                        <span class="type-tag ${this.getTypeColorClass(data.type)}">${data.type || '一般'}</span>
                    </div>
                </div>
            </div>`;
    },

    // 取得屬性對應的 CSS 類別 (用於內部渲染)
    getTypeColorClass: function(type) {
        const m = { "火": "type-fire", "水": "type-water", "草": "type-grass", "電": "type-electric" };
        return m[type] || "";
    },

    // 3. 傷害噴字特效 (新增 multiplier 倍率判斷)
    showDamage: function(id, amt, multiplier = 1) {
        const card = document.getElementById(id);
        if(!card) return;
        const rect = card.getBoundingClientRect();
        const d = document.createElement('div');
        d.className = 'damage-popup';
        
        // [加強 V7.0] 根據倍率調整視覺
        if(multiplier > 1) {
            d.innerText = `Critical! -${amt}`;
            d.style.color = "var(--arcade-gold)"; // 克制時顯示金黃色
            d.style.fontSize = "80px"; // 數字變更大
        } else if (multiplier < 1) {
            d.innerText = `Resist -${amt}`;
            d.style.color = "#aaa"; // 效果不好顯示灰色
        } else {
            d.innerText = `-${amt}`;
        }

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
