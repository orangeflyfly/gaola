// ui.js - V7.3 絕對防禦視覺版 (全代碼)
const GameUI = {
    // 1. 更新主畫面顯示
    updateDisplay: function(coins, pHP, eHP, pATB, eATB, partner, enemy) {
        const coinEl = document.getElementById('coin-count');
        if(coinEl) coinEl.innerText = coins;
        
        const pBar = document.getElementById('player-hp-bar-real');
        const eBar = document.getElementById('enemy-hp-bar');
        if(pBar) pBar.style.width = pHP + '%';
        if(eBar) eBar.style.width = eHP + '%';
        
        const pText = document.getElementById('player-hp-text');
        const eText = document.getElementById('enemy-hp-text');
        if(pText) pText.innerText = `${Math.ceil(pHP)} / 100`;
        if(eText) eText.innerText = `${Math.ceil(eHP)} / 100`;
        
        // 🌟 [V7.3 絕對鎖定公式] 0% 扣 0px，100% 剛好扣除圖片的 90px
        const pRacer = document.getElementById('player-racer');
        const eRacer = document.getElementById('enemy-racer');
        if(pRacer) pRacer.style.left = `calc(${pATB}% - ${pATB * 0.98}px)`;
        if(eRacer) eRacer.style.left = `calc(${eATB}% - ${eATB * 0.98}px)`;
        
        this.updateTypeTag('player-type', partner ? partner.type : '一般');
        this.updateTypeTag('enemy-type', enemy ? enemy.type : '一般');
        
        const pName = document.getElementById('player-name');
        if(partner && pName) pName.innerText = partner.name;
    },

    updateTypeTag: function(elementId, typeName) {
        const el = document.getElementById(elementId);
        if(!el) return;
        el.innerText = typeName;
        el.className = 'type-tag'; 
        const typeClassMap = { 
            "火": "type-fire", "水": "type-water", "草": "type-grass", "電": "type-electric", "一般": "type-normal"
        };
        if(typeClassMap[typeName]) el.classList.add(typeClassMap[typeName]);
    },

    // 2. 橫式卡匣渲染 (大廳專用)
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

    // 3. 背包卡匣統一渲染
    renderBackpack: function(backpackData) {
        const grid = document.getElementById('backpack-grid');
        if(!grid) return;
        grid.innerHTML = '';
        
        if (backpackData.length === 0) {
            grid.innerHTML = '<h2 style="color:#aaa; width:100%; text-align:center;">背包空空如也，快去投幣抓怪吧！</h2>';
            return;
        }

        backpackData.forEach((pokemon) => {
            const imgUrl = pokemon.image || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`;
            const typeStr = pokemon.type || '一般';
            
            grid.innerHTML += `
            <div class="backpack-item ${pokemon.rarity >= 6 ? 'rarity-6' : ''}">
                <img src="${imgUrl}" class="poke-sprite">
                <div class="card-info">
                    <div style="font-size: 14px; color: #aaa;">ID: ${pokemon.id}</div>
                    <div style="font-size: 24px; font-weight: bold; margin: 5px 0;">${pokemon.name}</div>
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <span style="font-size: 18px; color: #ffeb3b;">★ ${pokemon.rarity}</span>
                        <span class="type-tag ${this.getTypeColorClass(typeStr)}">${typeStr}</span>
                    </div>
                </div>
            </div>`;
        });
    },

    getTypeColorClass: function(type) {
        const m = { "火": "type-fire", "水": "type-water", "草": "type-grass", "電": "type-electric" };
        return m[type] || "";
    },

    // 4. 傷害噴字特效 (加入閃避判斷)
    showDamage: function(id, amt, multiplier = 1) {
        const card = document.getElementById(id);
        if(!card) return;
        const rect = card.getBoundingClientRect();
        const d = document.createElement('div');
        d.className = 'damage-popup';
        
        if (amt === 0) {
            d.innerText = `MISS!`;
            d.classList.add('miss'); 
        } else if(multiplier > 1) {
            d.innerText = `Critical! -${amt}`;
            d.style.color = "var(--arcade-gold)"; 
            d.style.fontSize = "80px"; 
        } else if (multiplier < 1) {
            d.innerText = `Resist -${amt}`;
            d.style.color = "#aaa"; 
        } else {
            d.innerText = `-${amt}`;
        }

        d.style.left = (rect.left + rect.width / 2) + 'px'; 
        d.style.top = (rect.top) + 'px';
        document.body.appendChild(d);
        setTimeout(() => d.remove(), 800);
    },

    shake: function(id) {
        const el = document.getElementById(id);
        if(el) {
            el.classList.add('shake');
            setTimeout(() => el.classList.remove('shake'), 400);
        }
    },

    shakeImpact: function(id) {
        const el = document.getElementById(id);
        if(el) {
            el.classList.remove('shake-impact'); 
            void el.offsetWidth; 
            el.classList.add('shake-impact');
        }
    },

    // 5. 動態 Combo 顯示引擎
    updateCombo: function(count) {
        const display = document.getElementById('combo-display');
        const track = document.querySelector('.track-bg');
        if(!display || !track) return;

        if (count === 0) {
            display.innerText = '';
            display.className = '';
            track.classList.remove('fever-mode');
            return;
        }

        display.style.transform = 'translateX(-50%) scale(1.5)';
        setTimeout(() => { display.style.transform = 'translateX(-50%) scale(1)'; }, 50);

        if (count >= 30) {
            display.innerText = `${count} COMBO! [FEVER]`;
            display.className = 'combo-lv3';
            track.classList.add('fever-mode');
        } else if (count > 10) {
            display.innerText = `${count} COMBO`;
            display.className = 'combo-lv2';
            track.classList.remove('fever-mode');
        } else {
            display.innerText = `${count} COMBO`;
            display.className = 'combo-lv1';
            track.classList.remove('fever-mode');
        }
    }
};
