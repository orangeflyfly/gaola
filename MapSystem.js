// MapSystem.js - V6.2.5 旗艦強化不刪減版
const MapSystem = {
    options: [],
    currentIndex: 0,

    // [加強] 初始化鍵盤監聽：讓玩家按左右鍵也能切換地圖
    bindKeys() {
        window.addEventListener('keydown', (e) => {
            if (typeof currentScreen !== 'undefined' && currentScreen === 'selection') {
                if (e.key === 'ArrowLeft') this.change(-1);
                if (e.key === 'ArrowRight') this.change(1);
            }
        });
    },

    // 1. 刷新地圖選項 (保留您原本的穩定 GitHub 來源邏輯)
    async refresh() {
        currentMapOptions = [];
        const imageBaseUrl = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/";
        
        for (let i = 0; i < 5; i++) {
            // 從機台庫存隨機挑選
            let p = machineInventory[Math.floor(Math.random() * machineInventory.length)];
            
            // 修正：直接組合 URL，解決 PokeAPI 官網連結不穩定的問題
            currentMapOptions.push({ 
                ...p, 
                image: `${imageBaseUrl}${p.id}.png` 
            });
        }
        
        this.currentIndex = 0;
        this.render(); // 呼叫渲染
    },

    // 2. 切換選單 (保留您原本的導航邏輯)
    change(dir) {
        if (typeof SoundSystem !== 'undefined') SoundSystem.play('button_click');
        this.currentIndex = (this.currentIndex + dir + 5) % 5;
        this.render();
    },

    // 3. 渲染主畫面地圖卡匣 (保留結構並加強視覺欄位)
    render() {
        const data = currentMapOptions[this.currentIndex];
        const display = document.getElementById('single-map-display');
        
        // 配合 CSS 的 .map-card 樣式，並預留屬性欄位
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

    // 4. 顯示投幣後的三選一 (保留您原本的 3D 按鈕邏輯並加強佈局)
    async showGuaranteed() {
        currentScreen = 'guaranteed';
        document.getElementById('selection-page').classList.add('hidden');
        document.getElementById('guaranteed-page').classList.remove('hidden');
        
        const container = document.getElementById('guaranteed-choices');
        container.innerHTML = "<div style='font-size:28px; color:#00fbff; font-weight:bold; animation: pulse 1s infinite;'>📡 棲息地掃描中...</div>";
        
        const imageBaseUrl = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/";
        let choices = [];
        
        // 隨機抽取三隻
        for(let i=0; i<3; i++) {
            let p = machineInventory[Math.floor(Math.random() * machineInventory.length)];
            choices.push({ 
                ...p, 
                image: `${imageBaseUrl}${p.id}.png` 
            });
        }
        
        // 清空並渲染三張大卡匣
        container.innerHTML = "";
        choices.forEach(p => {
            const div = document.createElement('div');
            div.className = `choice-card ${p.rarity >= 6 ? 'rarity-6' : ''}`;
            
            // 保留您的 3D 按鈕感，微調間距讓排版更「大氣」
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

// 啟動鍵盤監聽
MapSystem.bindKeys();
