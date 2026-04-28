// ui.js - V7.4.2 視覺與策略進化版 (全代碼不簡化)
const GameUI = {
    // 1. 更新主畫面顯示 (保留 V7.3 絕對鎖定邏輯)
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
        
        const pRacer = document.getElementById('player-racer');
        const eRacer = document.getElementById('enemy-racer');
        let safePATB = Math.min(pATB, 100);
        let safeEATB = Math.min(eATB, 100);
        if(pRacer) pRacer.style.left = `calc(${safePATB}% - ${safePATB * 0.98}px)`;
        if(eRacer) eRacer.style.left = `calc(${safeEATB}% - ${safeEATB * 0.98}px)`;
        
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

    // [V7.4 新增] 戰前準備頁面渲染
    renderPrepPage: function(enemy, backpack) {
        document.getElementById('prep-page').classList.remove('hidden');
        
        document.getElementById('prep-enemy-img').src = enemy.image;
        document.getElementById('prep-enemy-name').innerText = enemy.name;
        this.updateTypeTag('prep-enemy-type-tag', enemy.type);

        const listEl = document.getElementById('prep-backpack-list');
        listEl.innerHTML = '';
        
        backpack.forEach((poke, index) => {
            const item = document.createElement('div');
            item.className = 'prep-choice-item';
            item.innerHTML = `<img src="${poke.image}" title="${poke.name}">`;
            
            item.onclick = () => {
                document.querySelectorAll('.prep-choice-item').forEach(el => el.classList.remove('selected'));
                item.classList.add('selected');
                myPartner = poke; // 設定全域夥伴
                document.getElementById('start-battle-btn').style.display = 'block';
                if(typeof SoundSystem !== 'undefined') SoundSystem.play('ui_click');
            };
            listEl.appendChild(item);
        });
    },

    // [V7.4 新增] 大招過場啟動器
    showSkillCutIn: function(poke) {
        const overlay = document.getElementById('skill-overlay');
        const beam = document.querySelector('.skill-background-beam');
        const img = document.getElementById('skill-poke-img');
        const text = document.getElementById('skill-name-text');

        const typeMap = { "火": "fire", "水": "water", "草": "grass", "電": "electric", "一般": "normal" };
        const typeClass = typeMap[poke.type] || "normal";
        if(beam) beam.className = `skill-background-beam beam-${typeClass}`;

        if(img) img.src = poke.image;
        if(text) text.innerText = poke.skill || "全力攻擊！！";

        overlay.classList.remove('hidden');
        if(typeof SoundSystem !== 'undefined') SoundSystem.play('skill_cutin');

        setTimeout(() => {
            overlay.classList.add('hidden');
        }, 1000);
    },

    // [V7.4 新增] 輕量化粒子噴發引擎
    spawnParticles: function(targetId, type) {
        const layer = document.getElementById('vfx-layer');
        const target = document.getElementById(targetId);
        if(!layer || !target) return;

        const rect = target.getBoundingClientRect();
        const colors = { "火": "#ff5722", "水": "#03a9f4", "草": "#8bc34a", "電": "#ffeb3b" };
        const color = colors[type] || "#fff";

        for(let i=0; i<15; i++) {
            const p = document.createElement('div');
            p.className = 'particle';
            p.style.backgroundColor = color;
            p.style.left = (rect.left + rect.width/2) + 'px';
            p.style.top = (rect.top + rect.height/2) + 'px';
            
            const tx = (Math.random() - 0.5) * 300;
            const ty = (Math.random() - 0.5) * 300;
            p.style.setProperty('--tx', `${tx}px`);
            p.style.setProperty('--ty', `${ty}px`);
            
            layer.appendChild(p);
            setTimeout(() => p.remove(), 600);
        }
    },

    // 🌟 [V7.4.2 修復] 補回捕獲判定的球震動函數
    shake: function(id) {
        const el = document.getElementById(id);
        if(el) {
            el.classList.remove('shake'); // 先移除確保能重啟動畫
            void el.offsetWidth;         // 強制瀏覽器重繪
            el.classList.add('shake');
            setTimeout(() => el.classList.remove('shake'), 400);
        }
    },

    // 按鍵回饋物理震動
    shakeImpact: function(id) {
        const el = document.getElementById(id);
        if(el) {
            el.classList.remove('shake-impact'); 
            void el.offsetWidth; 
            el.classList.add('shake-impact');
        }
    },

    // 傷害噴字特效 (連動粒子)
    showDamage: function(id, amt, multiplier = 1, type = "一般") {
        const card = document.getElementById(id);
        if(!card) return;
        
        if (amt > 0) this.spawnParticles(id, type);

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

    // 渲染大廳地圖
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

    // 渲染背包
    renderBackpack: function(backpackData) {
        const grid = document.getElementById('backpack-grid');
        if(!grid) return;
        grid.innerHTML = '';
        
        if (backpackData.length === 0) {
            grid.innerHTML = '<h2 style="color:#aaa; width:100%; text-align:center;">背包空空如也！</h2>';
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
