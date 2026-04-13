// MapSystem.js - V6.2 圖片修復與佈局適配版
const MapSystem = {
    options: [],
    currentIndex: 0,

    // 刷新地圖選項
    async refresh() {
        currentMapOptions = [];
        // 穩定來源：GitHub 上的官方繪圖資料庫
        const imageBaseUrl = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/";
        
        for (let i = 0; i < 5; i++) {
            // 從數據庫隨機抓一隻寶可夢
            let p = machineInventory[Math.floor(Math.random() * machineInventory.length)];
            
            // 直接組合 URL，不再透過 fetch 去問 API 地址，速度更快且不會破圖
            currentMapOptions.push({ 
                ...p, 
                image: `${imageBaseUrl}${p.id}.png` 
            });
        }
        
        this.currentIndex = 0;
        this.render(); // 呼叫本地渲染
    },

    // 切換選單
    change(dir) {
        SoundSystem.play('button_click');
        this.currentIndex = (this.currentIndex + dir + 5) % 5;
        this.render();
    },

    // 呼叫 UI 渲染
    render() {
        GameUI.renderCarousel(this.currentIndex, currentMapOptions);
    },

    // 顯示投幣後的三選一
    async showGuaranteed() {
        currentScreen = 'guaranteed';
        document.getElementById('selection-page').classList.add('hidden');
        document.getElementById('guaranteed-page').classList.remove('hidden');
        
        const container = document.getElementById('guaranteed-choices');
        container.innerHTML = "📡 正在產生候選名單...";
        
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
            // 適配 CSS 的橫式卡片
            div.className = `choice-card ${p.rarity >= 6 ? 'rarity-6' : ''}`;
            div.innerHTML = `
                <img src="${p.image}" class="poke-sprite">
                <div class="card-info">
                    <b>${p.name}</b><br>
                    <span style="color: #aaa;">星等: ★${p.rarity}</span><br>
                    <button onclick="App.buyPokemon(${JSON.stringify(p).replace(/"/g, '&quot;')}, 0)" 
                            style="background:cyan; color:black; margin-top:5px; font-size:14px; padding:5px 15px;">
                        免費領取
                    </button>
                </div>`;
            container.appendChild(div);
        });
    }
};
