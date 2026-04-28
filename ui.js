// ui.js - V8.0.2 大師架構重組版 (特效系統聯動版)
const GameUI = {
    // 🌟 統一頁面管理器
    switchPage: function(targetId) {
        const pages = [
            'selection-page', 'guaranteed-page', 'prep-page', 
            'fighting-page', 'roulette-page', 'backpack-page',
            'pokedex-book-page'
        ];
        pages.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.add('hidden');
        });
        const target = document.getElementById(targetId);
        if (target) target.classList.remove('hidden');
    },

    // 🌟 核心卡匣組件
    createCardHtml: function(poke, mode = 'normal') {
        const typeClass = this.getTypeColorClass(poke.type);
        const rarityClass = poke.rarity >= 6 ? 'rarity-6' : '';
        const imgUrl = poke.image || `${GAME_CONFIG.ASSET_PATH}${poke.id}.png`;

        if (mode === 'backpack') {
            const isP = (typeof myPartner !== 'undefined' && myPartner.id === poke.id);
            return `
                <div class="backpack-item ${rarityClass}">
                    <img src="${imgUrl}" class="poke-sprite">
                    <div class="card-info">
                        <div style="font-size: 12px; opacity: 0.6;">ID: ${poke.id}</div>
                        <b>${poke.name}</b><br>
                        <span style="color:#ffeb3b; font-weight:bold;">★ ${poke.rarity}</span>
                        <button onclick="setPartner(${poke.id})" ${isP ? 'disabled' : ''} 
                                style="margin-top:5px; background: ${isP ? '#555' : 'var(--arcade-cyan)'}; color: ${isP ? '#aaa' : '#000'};">
                            ${isP ? '出戰中' : '選擇出戰'}
                        </button>
                    </div>
                </div>`;
        }

        return `
            <div class="map-card ${rarityClass}">
                <img src="${imgUrl}" class="poke-sprite">
                <div class="card-info">
                    <div style="font-size: 14px; color: var(--arcade-cyan); font-weight: bold;">REGION DATA</div>
                    <div style="font-size: 26px; font-weight: bold;">${poke.name}</div>
                    <div style="display: flex; gap: 10px; align-items: center; margin-top: 5px;">
                        <span style="font-size: 16px; opacity: 0.8;">★ ${poke.rarity}</span>
                        <span class="type-tag ${typeClass}">${poke.type || '一般'}</span>
                    </div>
                </div>
            </div>`;
    },

    // 1. 更新主畫面數值
    updateDisplay: function(coins, pHP, eHP, pATB, eATB, partner, enemy) {
        if(document.getElementById('coin-count')) 
            document.getElementById('coin-count').innerText = coins;
        
        const pBar = document.getElementById('player-hp-bar-real');
        const eBar = document.getElementById('enemy-hp-bar');
        if(pBar) pBar.style.width = pHP + '%';
        if(eBar) eBar.style.width = eHP + '%';
        
        if(document.getElementById('player-hp-text'))
            document.getElementById('player-hp-text').innerText = `${Math.ceil(pHP)} / 100`;
        if(document.getElementById('enemy-hp-text'))
            document.getElementById('enemy-hp-text').innerText = `${Math.ceil(eHP)} / 100`;
        
        const updateRacer = (id, atb) => {
            const el = document.getElementById(id);
            if(el) {
                let safeATB = Math.min(atb, 100);
                el.style.left = `calc(${safeATB}% - ${safeATB * 0.98}px)`;
            }
        };
        updateRacer('player-racer', pATB);
        updateRacer('enemy-racer', eATB);
        
        this.updateTypeTag('player-type', partner ? partner.type : '一般');
        this.updateTypeTag('enemy-type', enemy ? enemy.type : '一般');
        
        if(partner && document.getElementById('player-name'))
            document.getElementById('player-name').innerText = partner.name;
    },

    updateTypeTag: function(elementId, typeName) {
        const el = document.getElementById(elementId);
        if(!el) return;
        el.innerText = typeName;
        el.className = 'type-tag ' + this.getTypeColorClass(typeName);
    },

    // 2. 戰前準備頁面
    renderPrepPage: function(enemy, backpack) {
        this.switchPage('prep-page');
        
        document.getElementById('prep-enemy-img').src = enemy.image;
        document.getElementById('prep-enemy-name').innerText = enemy.name;
        this.updateTypeTag('prep-enemy-type-tag', enemy.type);

        const listEl = document.getElementById('prep-backpack-list');
        listEl.innerHTML = '';
        
        backpack.forEach((poke) => {
            const item = document.createElement('div');
            item.className = 'prep-choice-item';
            item.innerHTML = `<img src="${poke.image}" title="${poke.name}">`;
            item.onclick = () => {
                document.querySelectorAll('.prep-choice-item').forEach(el => el.classList.remove('selected'));
                item.classList.add('selected');
                myPartner = poke; 
                document.getElementById('start-battle-btn').style.display = 'block';
                if(typeof SoundSystem !== 'undefined') SoundSystem.play('ui_click');
            };
            listEl.appendChild(item);
        });
    },

    // 3. 視覺演出系列
    showSkillCutIn: function(poke) {
        const overlay = document.getElementById('skill-overlay');
        const beam = document.querySelector('.skill-background-beam');
        const text = document.getElementById('skill-name-text');

        const typeMap = { "火": "fire", "水": "water", "草": "grass", "電": "electric", "一般": "normal" };
        if(beam) beam.className = `skill-background-beam beam-${typeMap[poke.type] || "normal"}`;

        if(document.getElementById('skill-poke-img')) 
            document.getElementById('skill-poke-img').src = poke.image;
        if(text) text.innerText = poke.skill || "全力攻擊！！";

        overlay.classList.remove('hidden');
        if(typeof SoundSystem !== 'undefined') SoundSystem.play('skill_cutin');

        setTimeout(() => overlay.classList.add('hidden'), GAME_CONFIG.BATTLE.SKILL_CUTIN_DURATION);
    },

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
            p.style.left = `${rect.left + rect.width/2}px`;
            p.style.top = `${rect.top + rect.height/2}px`;
            p.style.setProperty('--tx', `${(Math.random() - 0.5) * 300}px`);
            p.style.setProperty('--ty', `${(Math.random() - 0.5) * 300}px`);
            layer.appendChild(p);
            setTimeout(() => p.remove(), 600);
        }
    },

    shake: function(id) {
        const el = document.getElementById(id);
        if(el) {
            el.classList.remove('shake');
            void el.offsetWidth;
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

    showDamage: function(id, amt, multiplier = 1, type = "一般") {
        const card = document.getElementById(id);
        if(!card) return;
        if (amt > 0) this.spawnParticles(id, type);

        const rect = card.getBoundingClientRect();
        const d = document.createElement('div');
        d.className = 'damage-popup' + (amt === 0 ? ' miss' : '');
        
        if (amt === 0) d.innerText = `MISS!`;
        else if(multiplier > 1) {
            d.innerText = `Critical! -${amt}`;
            d.style.color = "var(--arcade-gold)"; 
            d.style.fontSize = "80px";
        } else {
            d.innerText = (multiplier < 1 ? `Resist ` : ``) + `-${amt}`;
            if(multiplier < 1) d.style.color = "#aaa";
        }

        d.style.left = `${rect.left + rect.width / 2}px`;
        d.style.top = `${rect.top}px`;
        document.body.appendChild(d);
        setTimeout(() => d.remove(), 800);
    },

    // 4. 渲染核心
    renderCarousel: function(idx, options) {
        const display = document.getElementById('single-map-display');
        if(display && options[idx]) {
            display.innerHTML = this.createCardHtml(options[idx]);
        }
    },

    renderBackpack: function(backpackData) {
        const grid = document.getElementById('backpack-grid');
        if(!grid) return;
        grid.innerHTML = backpackData.length === 0 ? 
            '<h2 style="color:#aaa; width:100%; text-align:center;">背包空空如也！</h2>' : 
            backpackData.map(p => this.createCardHtml(p, 'backpack')).join('');
    },

    getTypeColorClass: function(type) {
        const m = { "火": "type-fire", "水": "type-water", "草": "type-grass", "電": "type-electric" };
        return m[type] || "type-normal";
    },

    // 🌟 [V8.0.2 聯動修正] 更新連擊顯示，並觸發模糊特效
    updateCombo: function(count) {
        const display = document.getElementById('combo-display');
        const track = document.querySelector('.track-bg');
        if(!display || !track) return;

        if (count === 0) {
            display.innerText = '';
            display.className = '';
            track.classList.remove('fever-mode');
            // 🌟 關閉模糊
            if(typeof EffectSystem !== 'undefined') EffectSystem.applyFeverBlur(false);
            return;
        }

        display.style.transform = 'translateX(-50%) scale(1.5)';
        setTimeout(() => display.style.transform = 'translateX(-50%) scale(1)', 50);

        const threshold = GAME_CONFIG.BATTLE.COMBO_FEVER_THRESHOLD;
        if (count >= threshold) {
            display.innerText = `${count} COMBO! [FEVER]`;
            display.className = 'combo-lv3';
            track.classList.add('fever-mode');
            // 🌟 開啟模糊
            if(typeof EffectSystem !== 'undefined') EffectSystem.applyFeverBlur(true);
        } else {
            display.innerText = `${count} COMBO`;
            display.className = count > 10 ? 'combo-lv2' : 'combo-lv1';
            track.classList.remove('fever-mode');
            // 🌟 雖然在連打，但還沒到 Fever，保持清晰
            if(typeof EffectSystem !== 'undefined') EffectSystem.applyFeverBlur(false);
        }
    }
};
