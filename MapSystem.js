// MapSystem.js - V6.2.4 影像修復與橫式卡匣適配版
const MapSystem = {
    options: [],
    currentIndex: 0,

    // 1. 刷新地圖選項 (使用最穩定的 GitHub 來源)
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

    // 2. 切換選單 (搭配導航箭頭)
    change(dir) {
        SoundSystem.play('button_click');
        this.currentIndex = (this.currentIndex + dir + 5) % 5;
        this.render();
    },

    // 3. 渲染主畫面地圖卡匣 (圖左字右)
    render() {
        const data = currentMapOptions[this.currentIndex];
        const display = document.getElementById('single-map-display');
        
        // 配合 CSS 的 .map-card 樣式
        display.innerHTML = `
            <div class="map-card ${data.rarity >= 6 ? 'rarity-6' : ''}">
                <img src="${data.image}" class="poke-sprite">
                <div class="card-info">
                    <div style="font-size: 16px; color: #00d4ff; font-weight: bold; margin-bottom: 5px;">REGION 0${this.currentIndex + 1}</div>
                    <b>${data.name}</b>
                    <div style="font-size: 20px; color: #aaa; margin-top: 5px;">★ ${data.rarity}</div>
                </div>
            </div>`;
    },

    // 4. 顯示投幣後的三選一 (橫式卡匣版)
    async showGuaranteed() {
        currentScreen = 'guaranteed';
        document.getElementById('selection-page').classList.add('hidden');
        document.getElementById('guaranteed-page').classList.remove('hidden');
        
        const container = document.getElementById('guaranteed-choices');
        container.innerHTML = "<div style='font-size:24px; color:cyan;'>📡 掃描棲息地中...</div>";
        
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
            
            // 這裡使用了總監要求的 3D 按鈕感，並確保卡匣內容橫向對齊
            div.innerHTML = `
                <img src="${p.image}" class="poke-sprite">
                <div class="card-info">
                    <b>${p.name}</b><br>
                    <span style="font-size: 18px; color: #aaa;">星等: ★${p.rarity}</span><br>
                    <button onclick='App.buyPokemon(${JSON.stringify(p)}, 0)' 
                            style="margin-top: 10px; width: 100%; background: linear-gradient(to bottom, #00fbff, #008183); color: #000;">
                        捕捉這張
                    </button>
                </div>`;
            container.appendChild(div);
        });
    }
};
