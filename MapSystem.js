// MapSystem.js - V9.0.4 街機保底與遭遇機制版 (全代碼不簡化)

const MapSystem = {
    options: [],
    currentIndex: 0,
    grassChoices: [], // 儲存三株草叢裡的寶可夢
    isAwake: false,   // 紀錄機台是否已經投幣喚醒
    canPickGrass: false, // 確保球落地後玩家才能點擊

    // 1. 刷新地圖選項
    async refresh() {
        currentMapOptions = [];
        const imageBaseUrl = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/";
        
        for (let i = 0; i < 5; i++) {
            let p = machineInventory[Math.floor(Math.random() * machineInventory.length)];
            let silhouettes = [];
            for(let j=0; j<4; j++) {
                let s = machineInventory[Math.floor(Math.random() * machineInventory.length)];
                silhouettes.push({ id: s.id, image: `${imageBaseUrl}${s.id}.png` });
            }

            currentMapOptions.push({ 
                ...p, 
                image: `${imageBaseUrl}${p.id}.png`,
                silhouettes: silhouettes
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

    // 3. 渲染主畫面
    render() {
        const data = currentMapOptions[this.currentIndex];
        const display = document.getElementById('single-map-display');
        const silhouetteContainer = document.getElementById('map-silhouettes');
        if(!data || !display) return;

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

        if(silhouetteContainer) {
            silhouetteContainer.innerHTML = data.silhouettes.map(s => `
                <img src="${s.image}" class="silhouette-icon">
            `).join('');
        }
    },

    // 4. 確認地圖選擇：第一階段投幣保底
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

    // 5. 三草叢初始化：系統自動撒網
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

        this.canPickGrass = false;
        const grassBoxes = document.querySelectorAll('.grass-box');
        
        // 系統自動連續丟出三顆精靈球
        grassBoxes.forEach((box, index) => {
            box.dataset.selected = "false";
            box.innerHTML = `<div class="grass-sprite"></div>`;

            setTimeout(() => {
                const ball = document.createElement('div');
                ball.className = 'throw-ball';
                box.appendChild(ball);
                ball.style.animation = 'throwArc 0.6s ease-in-out forwards';

                setTimeout(() => {
                    if (ball.parentNode === box) ball.remove();
                    // 第三顆球落地後開放玩家點擊
                    if (index === 2) { 
                        if (typeof SoundSystem !== 'undefined') SoundSystem.play('attack_hit');
                        this.canPickGrass = true; 
                    }
                }, 600);
            }, index * 200); 
        });
    },

    // 6. 點擊開獎：獲得保底怪，隨後進入戰鬥遭遇
    selectGrass(index) {
        if (!this.canPickGrass) return;

        const picked = this.grassChoices[index];
        const grassBoxes = document.querySelectorAll('.grass-box');
        const targetGrass = grassBoxes[index];
        
        this.canPickGrass = false;
        grassBoxes.forEach(box => box.dataset.selected = "true");

        if (typeof SoundSystem !== 'undefined') SoundSystem.play('ui_click');

        // 噴發開獎光束
        const beam = document.createElement('div');
        beam.className = `beam-effect ${picked.rarity >= 6 ? 'gold-beam' : 'blue-beam'}`;
        targetGrass.appendChild(beam);

        if (picked.rarity >= 6 && typeof SoundSystem !== 'undefined') {
            SoundSystem.play('shiny_spawn'); 
        }

        setTimeout(() => {
            beam.remove();
            targetGrass.innerHTML = `<img src="${picked.image}" style="width:100%; animation: pulse 0.5s;">`;
            
            // 🌟 [保底邏輯] 開獎後直接將此怪加入背包
            if (typeof backpack !== 'undefined') {
                backpack.push({...picked});
                if (typeof StorageSystem !== 'undefined') StorageSystem.save();
                console.log("獲得保底寶可夢：", picked.name);
            }

            // 🌟 [戰鬥遭遇] 判定接下來要打誰 (區域BOSS機率提升)
            setTimeout(() => {
                let finalEnemy = picked; // 預設對手
                
                // 70% 機率直接遭遇剛剛選的地圖 BOSS
                const encounterSeed = Math.random();
                if(encounterSeed < 0.7) {
                    finalEnemy = currentMapOptions[this.currentIndex]; 
                    console.log("遭遇區域 BOSS：", finalEnemy.name);
                } else {
                    // 30% 機率隨機從庫存抽一隻路人怪
                    let p = machineInventory[Math.floor(Math.random() * machineInventory.length)];
                    const imageBaseUrl = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/";
                    finalEnemy = { ...p, image: `${imageBaseUrl}${p.id}.png` };
                    console.log("遭遇隨機野生寶可夢：", finalEnemy.name);
                }

                BattleSystem.initPrep(finalEnemy);
            }, 1200);
        }, 1000);
    },

    // 7. 顯示投幣後的三選一
    async showGuaranteed() {
        currentScreen = 'guaranteed';
        document.getElementById('selection-page').classList.add('hidden');
        document.getElementById('guaranteed-page').classList.remove('hidden');
        const container = document.getElementById('guaranteed-choices');
        container.innerHTML = "<div style='font-size:28px; color:#00fbff; font-weight:bold;'>📡 掃描中...</div>";
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
                        <span style="font-size: 18px; color: #ffeb3b; font-weight: bold;">★${p.rarity}</span>
                    </div>
                    <button onclick='App.buyPokemon(${JSON.stringify(p)}, 0)' 
                            style="margin-top: 5px; width: 100%; background: linear-gradient(to bottom, #00fbff, #008183); color: #000; font-weight: 900; border-radius: 8px;">
                        確認收服
                    </button>
                </div>`;
            container.appendChild(div);
        });
    }
};

function confirmMapSelection() { MapSystem.confirmSelection(); }
function changeMap(dir) { MapSystem.change(dir); }
