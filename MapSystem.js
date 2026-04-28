// MapSystem.js - V9.0 街機沉浸邏輯版 (全代碼不簡化，新增亮屏、剪影、三草叢)

const MapSystem = {
    options: [],
    currentIndex: 0,
    grassChoices: [], // 儲存三株草叢裡的寶可夢

    // 1. 刷新地圖選項 (保留總監 GitHub 穩定來源)
    async refresh() {
        currentMapOptions = [];
        const imageBaseUrl = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/";
        
        for (let i = 0; i < 5; i++) {
            let p = machineInventory[Math.floor(Math.random() * machineInventory.length)];
            
            // 🌟 V9.0 新增：為每個區域預抽 4 個「黑色剪影」寶可夢
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

    // 3. 渲染主畫面與剪影 (不簡化原本卡匣結構)
    render() {
        const data = currentMapOptions[this.currentIndex];
        const display = document.getElementById('single-map-display');
        const silhouetteContainer = document.getElementById('map-silhouettes');
        
        if(!data || !display) return;

        // A. 渲染大型地圖展示框
        display.innerHTML = `
            <div class="map-card ${data.rarity >= 6 ? 'rarity-6' : ''}" style="width:100%; height:100%; border:none; background:none;">
                <img src="${data.image}" class="poke-sprite" style="width:250px; height:250px;">
                <div class="card-info">
                    <div style="font-size: 20px; color: #00d4ff; font-weight: bold; margin-bottom: 10px; letter-spacing: 2px;">探索區域 0${this.currentIndex + 1}</div>
                    <b style="font-size: 42px; text-shadow: 0 0 15px rgba(0,212,255,0.5);">${data.name}</b>
                    <div style="margin: 15px 0;">
                        <span style="background: rgba(0,212,255,0.2); padding: 5px 15px; border-radius: 20px; font-size: 18px; color: #fff; border: 1px solid #00d4ff;">
                            危險程度 ★ ${data.rarity}
                        </span>
                    </div>
                </div>
            </div>`;

        // B. 🌟 V9.0 新增：渲染下方黑色剪影
        if(silhouetteContainer) {
            silhouetteContainer.innerHTML = data.silhouettes.map(s => `
                <img src="${s.image}" class="silhouette-icon">
            `).join('');
        }
    },

    // 🌟 4. 確認地圖選擇 (實裝投幣亮屏演出)
    confirmSelection() {
        const selectedEnemy = currentMapOptions[this.currentIndex];
        
        if (coins < 30) {
            alert("⚠️ 金幣不足！請先去打工賺錢。");
            return;
        }

        // 扣除金幣
        coins -= 30;
        if (typeof SoundSystem !== 'undefined') SoundSystem.play('coin_in');
        const coinEl = document.getElementById('coin-count');
        if(coinEl) coinEl.innerText = coins;

        // 🚀 [亮屏演出] 畫面閃白光覺醒
        const screen = document.getElementById('main-screen');
        screen.classList.remove('screen-off');
        screen.classList.add('screen-wake');

        // 演出結束後進入草叢頁面
        setTimeout(() => {
            screen.classList.remove('screen-wake');
            this.initGrassEvent(selectedEnemy);
        }, 800);
    },

    // 🌟 5. [新增] 三草叢奇遇初始化
    initGrassEvent(mapBoss) {
        currentScreen = 'grass';
        const imageBaseUrl = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/";
        
        // 生成三株草裡的寶可夢：一隻是地圖Boss，兩隻是隨機路人
        this.grassChoices = [];
        this.grassChoices.push(mapBoss); // 必有一隻是地圖看見的那隻
        
        for(let i=0; i<2; i++) {
            let p = machineInventory[Math.floor(Math.random() * machineInventory.length)];
            this.grassChoices.push({ ...p, image: `${imageBaseUrl}${p.id}.png` });
        }

        // 隨機打亂草叢順序
        this.grassChoices.sort(() => Math.random() - 0.5);

        // 切換 UI
        if(typeof GameUI !== 'undefined') {
            GameUI.switchPage('grass-event-page');
        }
    },

    // 🌟 6. [新增] 點擊草叢邏輯
    selectGrass(index) {
        const picked = this.grassChoices[index];
        if (typeof SoundSystem !== 'undefined') SoundSystem.play('ui_click');

        // 視覺：讓選中的草叢消失，顯示寶可夢
        const grassBoxes = document.querySelectorAll('.grass-box');
        grassBoxes[index].innerHTML = `<img src="${picked.image}" style="width:100%; animation: pulse 0.5s;">`;

        console.log("草叢揭曉：", picked.name);

        // 延遲一下，進入最終戰前準備 (隨機判定是否被「亂入」)
        setTimeout(() => {
            // 80% 是你選到的，20% 觸發強大氣息亂入 (換成地圖上的 Boss 或是神獸)
            let finalEnemy = picked;
            if(Math.random() < 0.2) {
                finalEnemy = currentMapOptions[this.currentIndex]; // 或是更強的怪
                alert("❗ 突然間，一股強大的氣息亂入了戰場！");
            }
            
            BattleSystem.initPrep(finalEnemy);
        }, 1500);
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
