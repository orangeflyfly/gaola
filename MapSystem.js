// MapSystem.js - V9.0.3 街機開獎儀式版 (全代碼不簡化，新增丟球與光束開獎)

const MapSystem = {
    options: [],
    currentIndex: 0,
    grassChoices: [], // 儲存三株草叢裡的寶可夢
    isAwake: false,   // 紀錄機台是否已經投幣喚醒

    // 1. 刷新地圖選項 (保留總監 GitHub 穩定來源)
    async refresh() {
        currentMapOptions = [];
        const imageBaseUrl = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/";
        
        for (let i = 0; i < 5; i++) {
            let p = machineInventory[Math.floor(Math.random() * machineInventory.length)];
            
            // V9.0 新增：為每個區域預抽 4 個「黑色剪影」寶可夢
            let silhouettes = [];
            for(let j=0; j<4; j++) {
                let s = machineInventory[Math.floor(Math.random() * machineInventory.length)];
                silhouettes.push({ id: s.id, image: `${imageBaseUrl}${s.id}.png` });
            }

            currentMapOptions.push({ 
                ...p, 
                image: `${imageBaseUrl}${p.id}.png`,
                silhouettes: silhouettes // 將剪影資料死死刻入地圖選項
            });
        }
        
        this.currentIndex = 0;
        this.render(); 
    },

    // 2. 切換選單
    change(dir) {
        if (typeof SoundSystem !== 'undefined') SoundSystem.play('button_click');
        this.currentIndex = (this.currentIndex + dir + 5) % 5;
        this.render();
    },

    // 3. 渲染主畫面與剪影 (🌟 V9.0.3 修正：解除排版衝突，防止字體斷行)
    render() {
        const data = currentMapOptions[this.currentIndex];
        const display = document.getElementById('single-map-display');
        const silhouetteContainer = document.getElementById('map-silhouettes');
        
        if(!data || !display) return;

        // 🚀 修正：改用 large-map-content 類別，避免繼承 map-card 的 420px 限制
        display.innerHTML = `
            <div class="large-map-content ${data.rarity >= 6 ? 'rarity-6' : ''}">
                <img src="${data.image}" class="poke-sprite">
                <div class="card-info">
                    <div style="font-size: 18px; color: #00d4ff; font-weight: bold; margin-bottom: 8px; letter-spacing: 2px;">探索區域 0${this.currentIndex + 1}</div>
                    <b style="font-size: 42px; text-shadow: 0 0 15px rgba(0,212,255,0.5);">${data.name}</b>
                    <div style="margin-top: 15px;">
                        <span style="background: rgba(0,212,255,0.2); padding: 6px 18px; border-radius: 30px; font-size: 18px; color: #fff; border: 1px solid #00d4ff;">
                            危險程度 ★ ${data.rarity}
                        </span>
                    </div>
                </div>
            </div>`;

        // 渲染下方黑色剪影
        if(silhouetteContainer) {
            silhouetteContainer.innerHTML = data.silhouettes.map(s => `
                <img src="${s.image}" class="silhouette-icon">
            `).join('');
        }
    },

    // 4. 確認地圖選擇 (拆分為「投幣喚醒」與「確認地圖」兩階段)
    confirmSelection() {
        if (!this.isAwake) {
            if (coins < 30) {
                alert("⚠️ 金幣不足！請先點擊下方『🪙 打工』賺取金幣。");
                return;
            }
            coins -= 30;
            if (typeof SoundSystem !== 'undefined') SoundSystem.play('coin_in');
            const coinEl = document.querySelectorAll('#coin-count');
            coinEl.forEach(el => el.innerText = coins);

            const standby = document.getElementById('standby-screen');
            if(standby) standby.classList.add('hidden');

            const screen = document.getElementById('main-screen');
            if(screen) {
                screen.classList.remove('screen-off');
                screen.classList.add('screen-wake');
            }
            this.isAwake = true;

            const physicalBtn = document.querySelector('.btn-red');
            if(physicalBtn) physicalBtn.innerText = "⭕ 確認地圖 (前往草叢)";
        } else {
            const selectedEnemy = currentMapOptions[this.currentIndex];
            if (typeof SoundSystem !== 'undefined') SoundSystem.play('ui_click');
            this.initGrassEvent(selectedEnemy);
        }
    },

    // 5. 三草叢奇遇初始化
    initGrassEvent(mapBoss) {
        currentScreen = 'grass';
        const imageBaseUrl = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/";
        this.grassChoices = [];
        this.grassChoices.push(mapBoss);
        
        for(let i=0; i<2; i++) {
            let p = machineInventory[Math.floor(Math.random() * machineInventory.length)];
            this.grassChoices.push({ ...p, image: `${imageBaseUrl}${p.id}.png` });
        }
        this.grassChoices.sort(() => Math.random() - 0.5);

        if(typeof GameUI !== 'undefined') GameUI.switchPage('grass-event-page');
    },

    // 🌟 6. [V9.0.3 修正] 點擊草叢邏輯 (實裝丟球動作與光束儀式)
    selectGrass(index) {
        const picked = this.grassChoices[index];
        const grassBoxes = document.querySelectorAll('.grass-box');
        const targetGrass = grassBoxes[index];
        
        if (targetGrass.dataset.selected === "true") return; // 防止重複點擊
        targetGrass.dataset.selected = "true";

        if (typeof SoundSystem !== 'undefined') SoundSystem.play('ui_click');

        // --- Step 1: 建立丟球動畫 ---
        const ball = document.createElement('div');
        ball.className = 'throw-ball';
        targetGrass.appendChild(ball);
        ball.style.animation = 'throwArc 0.6s ease-in-out forwards';

        // --- Step 2: 球命中後觸發光束 ---
        setTimeout(() => {
            ball.remove();
            if (typeof SoundSystem !== 'undefined') SoundSystem.play('attack_hit');

            // 建立光束容器
            const beam = document.createElement('div');
            beam.className = `beam-effect ${picked.rarity >= 6 ? 'gold-beam' : 'blue-beam'}`;
            targetGrass.appendChild(beam);

            // 如果是 6 星，播放傳說級音效 (如果有)
            if (picked.rarity >= 6 && typeof SoundSystem !== 'undefined') {
                SoundSystem.play('shiny_spawn'); 
            }

            // --- Step 3: 光束結束後揭曉 ---
            setTimeout(() => {
                beam.remove();
                targetGrass.innerHTML = `<img src="${picked.image}" style="width:100%; animation: pulse 0.5s;">`;
                console.log("開獎揭曉：", picked.name);

                // 延遲進入戰前準備
                setTimeout(() => {
                    let finalEnemy = picked;
                    if(Math.random() < 0.2) {
                        finalEnemy = currentMapOptions[this.currentIndex]; 
                        alert("❗ 突然間，一股強大的氣息亂入了戰場！");
                    }
                    BattleSystem.initPrep(finalEnemy);
                }, 1000);
            }, 1000); // 光束維持時間
        }, 600); // 丟球飛行時間
    },

    // 7. 顯示投幣後的三選一 (原封不動保留)
    async showGuaranteed() {
        currentScreen = 'guaranteed';
        document.getElementById('selection-page').classList.add('hidden');
        document.getElementById('guaranteed-page').classList.remove('hidden');
        
        const container = document.getElementById('guaranteed-choices');
        container.innerHTML = "<div style='font-size:28px; color:#00fbff; font-weight:bold;'>📡 棲息地掃描中...</div>";
        
        const imageBaseUrl = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/";
        let choices = [];
        for(let i=0; i<3; i++) {
            let p = machineInventory[Math.floor(Math.random() * machineInventory.length)];
            choices.push({ ...p, image: `${imageBaseUrl}${p.id}.png` });
        }
        
        container.innerHTML = "";
        choices.forEach(p => {
            const div = document.createElement('div');
            div.className = `choice-card ${p.rarity >= 6 ? 'rarity-6' : ''}`;
            div.innerHTML = `
                <img src="${p.image}" class="poke-sprite">
                <div class="card-info">
                    <b style="font-size: 26px;">${p.name}</b><br>
                    <div style="margin: 8px 0;">
                        <span style="font-size: 18px; color: #ffeb3b; font-weight: bold;">GRADE ★${p.rarity}</span>
                    </div>
                    <button onclick='App.buyPokemon(${JSON.stringify(p)}, 0)' 
                            style="margin-top: 5px; width: 100%; height: 45px; background: linear-gradient(to bottom, #00fbff, #008183); color: #000; font-weight: 900; border: 2px solid #fff; border-radius: 8px; cursor: pointer;">
                        確認收服
                    </button>
                </div>`;
            container.appendChild(div);
        });
    }
};

function confirmMapSelection() { MapSystem.confirmSelection(); }
function changeMap(dir) { MapSystem.change(dir); }
