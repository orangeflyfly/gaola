// PokedexSystem.js - V8.0.1 數據同步修正版

const PokedexSystem = {
    currentPage: 0, 
    seenIds: [],    
    caughtIds: [],  

    // 1. 修正版：初始化並開啟圖鑑 (加入背包同步邏輯)
    open() {
        console.log("正在同步數據並打開典藏之書...");
        
        const record = GameStorage.loadPokedexRecord();
        this.seenIds = record.seen || [];
        this.caughtIds = record.caught || [];

        // 🚀 [數據同步修正] 檢查當前背包，將舊資料補進圖鑑
        if (typeof myBackpack !== 'undefined' && myBackpack.length > 0) {
            myBackpack.forEach(p => {
                if (!this.caughtIds.includes(p.id)) {
                    this.caughtIds.push(p.id);
                    // 同步寫入 LocalStorage 確保永久生效
                    GameStorage.updatePokedex(p.id, 'caught');
                }
            });
        }

        this.render();
        this.updateStats();
        
        // 使用 V8.0 統一換頁接口
        if(typeof GameUI !== 'undefined') GameUI.switchPage('pokedex-book-page');
        if(typeof SoundSystem !== 'undefined') SoundSystem.play('ui_click');
    },

    render() {
        const leftPageEl = document.getElementById('pokedex-left-page');
        const rightPageEl = document.getElementById('pokedex-right-page');
        const pageInfoEl = document.getElementById('pokedex-page-info');

        if (!leftPageEl || !rightPageEl) return;

        leftPageEl.innerHTML = '';
        rightPageEl.innerHTML = '';

        const itemsPerSpread = POKEDEX_CONFIG.ITEMS_PER_SPREAD || 6;
        const startIdx = this.currentPage * itemsPerSpread;

        for (let i = 0; i < 3; i++) {
            const pokeData = machineInventory[startIdx + i];
            if (pokeData) {
                leftPageEl.innerHTML += this.createEntryHtml(pokeData);
            }
        }

        for (let i = 3; i < 6; i++) {
            const pokeData = machineInventory[startIdx + i];
            if (pokeData) {
                rightPageEl.innerHTML += this.createEntryHtml(pokeData);
            }
        }

        const totalPages = Math.ceil(machineInventory.length / itemsPerSpread);
        if (pageInfoEl) {
            pageInfoEl.innerText = `第 ${this.currentPage + 1} / ${totalPages} 頁`;
        }
    },

    createEntryHtml(poke) {
        const isCaught = this.caughtIds.includes(poke.id);
        const isSeen = this.seenIds.includes(poke.id) || isCaught;
        
        let contentHtml = '';
        let statusClass = 'locked';

        if (isCaught) {
            statusClass = 'caught';
            contentHtml = `
                <img src="${GAME_CONFIG.ASSET_PATH}${poke.id}.png" class="pokedex-img">
                <div class="pokedex-info">
                    <span class="pokedex-id">No.${poke.id.toString().padStart(3, '0')}</span>
                    <div class="pokedex-name">${poke.name}</div>
                    <div class="pokedex-rarity">★ ${poke.rarity}</div>
                </div>
            `;
        } else if (isSeen) {
            statusClass = 'seen';
            contentHtml = `
                <img src="${GAME_CONFIG.ASSET_PATH}${poke.id}.png" class="pokedex-img silhouette">
                <div class="pokedex-info">
                    <span class="pokedex-id">No.${poke.id.toString().padStart(3, '0')}</span>
                    <div class="pokedex-name">???</div>
                </div>
            `;
        } else {
            statusClass = 'unknown';
            contentHtml = `
                <div class="pokedex-placeholder">?</div>
                <div class="pokedex-info">
                    <span class="pokedex-id">No.${poke.id.toString().padStart(3, '0')}</span>
                </div>
            `;
        }

        return `<div class="pokedex-entry ${statusClass}">${contentHtml}</div>`;
    },

    nextPage() {
        const totalPages = Math.ceil(machineInventory.length / (POKEDEX_CONFIG.ITEMS_PER_SPREAD || 6));
        if (this.currentPage < totalPages - 1) {
            this.currentPage++;
            this.render();
            if(typeof SoundSystem !== 'undefined') SoundSystem.play('button_click');
        }
    },

    prevPage() {
        if (this.currentPage > 0) {
            this.currentPage--;
            this.render();
            if(typeof SoundSystem !== 'undefined') SoundSystem.play('button_click');
        }
    },

    updateStats() {
        const countEl = document.getElementById('pokedex-count');
        if (countEl) {
            countEl.innerText = `${this.caughtIds.length} / ${machineInventory.length}`;
        }
    }
};

function openPokedex() { PokedexSystem.open(); }
function closePokedex() {
    currentScreen = 'selection';
    if(typeof GameUI !== 'undefined') GameUI.switchPage('selection-page');
}
