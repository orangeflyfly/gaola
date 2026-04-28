// MapSystem.js - V7.4 策略進化與路徑修正版 (全代碼不簡化)
const MapSystem = {
    options: [],
    currentIndex: 0,

    // 1. 刷新地圖選項 (使用最穩定的 GitHub 來源)
    async refresh() {
        currentMapOptions = [];
        // 穩定來源：GitHub 官方繪圖庫
        const imageBaseUrl = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/";
        
        for (let i = 0; i < 5; i++) {
            let p = machineInventory[Math.floor(Math.random() * machineInventory.length)];
            
            // 修正：確保圖片路徑強制指向穩定伺服器
            currentMapOptions.push({ 
                ...p, 
                image: `${imageBaseUrl}${p.id}.png` 
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

    // 3. 渲染主畫面地圖卡匣
    render() {
        const data = currentMapOptions[this.currentIndex];
        const display = document.getElementById('single-map-display');
        
        if(!data || !display) return;

        display.innerHTML = `
            <div class="map-card ${data.rarity >= 6 ? 'rarity-6' : ''}">
                <img src="${data.image}" class="poke-sprite">
                <div class="card-info">
                    <div style="font-size: 16px; color: #00d4ff; font-weight: bold; margin-bottom: 5px; letter-spacing: 1px;">REGION 0${this.currentIndex + 1}</div>
                    <b style="font-size: 28px;">${data.name}</b>
                    <div style="margin: 5px 0;">
                        <span style="background: rgba(255,255,255,0.1); padding: 2px 10px; border-radius: 4px; font-size: 14px; color: #eee;">★ ${data.rarity} 星等</span>
                    </div>
                </div>
            </div>`;
    },

    // 🌟 [V7.4 新增] 4. 確認地圖選擇：進入戰前準備階段
    confirmSelection() {
        const selectedEnemy = currentMapOptions[this.currentIndex];
        
        // 檢查金幣是否足夠 (30金幣)
        if (coins < 30) {
            alert("⚠️ 金幣不足！請先去打工賺錢。");
            return;
        }

        // 扣除金幣並播放音效
        coins -= 30;
        if (typeof SoundSystem !== 'undefined') SoundSystem.play('coin_in');
        
        // 更新頂部金幣顯示
        const coinEl = document.getElementById('coin-count');
        if(coinEl) coinEl.innerText = coins;

        // 🚀 [關鍵路徑] 不再直接進入 BattleSystem.start
        // 而是進入 V7.4 新增的「戰前準備」流程
        console.log("進入準備階段，遭遇對手：", selectedEnemy.name);
        BattleSystem.initPrep(selectedEnemy);
    },

    // 5. 顯示投幣後的三選一 (橫式卡匣版)
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
            choices.push({ 
                ...p, 
                image: `${imageBaseUrl}${p.id}.png` 
            });
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

// 🌟 [V7.4 全域橋接] 確保 HTML 中的 onclick="confirmMapSelection()" 能夠運作
function confirmMapSelection() {
    MapSystem.confirmSelection();
}

// 橋接 changeMap 函數
function changeMap(dir) {
    MapSystem.change(dir);
}
