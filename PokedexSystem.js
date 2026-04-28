// PokedexSystem.js - V8.0 典藏之書邏輯中樞

const PokedexSystem = {
    currentPage: 0, // 當前對開頁索引 (0 代表 1-6 號)
    seenIds: [],    // 已遇見的 ID 陣列
    caughtIds: [],  // 已收服的 ID 陣列

    // 1. 初始化並開啟圖鑑
    open() {
        console.log("正在打開典藏之書...");
        
        // 從 Storage 讀取最新的圖鑑紀錄 (若無則初始化)
        const record = GameStorage.loadPokedexRecord();
        this.seenIds = record.seen || [];
        this.caughtIds = record.caught || [];

        this.render();
        this.updateStats();
        
        // 使用 V8.0 統一換頁接口
        if(typeof GameUI !== 'undefined') GameUI.switchPage('pokedex-book-page');
        if(typeof SoundSystem !== 'undefined') SoundSystem.play('ui_click');
    },

    // 2. 核心渲染邏輯：分配左右頁面
    render() {
        const leftPageEl = document.getElementById('pokedex-left-page');
        const rightPageEl = document.getElementById('pokedex-right-page');
        const pageInfoEl = document.getElementById('pokedex-page-info');

        if (!leftPageEl || !rightPageEl) return;

        // 清空當前書頁
        leftPageEl.innerHTML = '';
        rightPageEl.innerHTML = '';

        // 計算當前對開頁的起始 ID
        // 每對開一次顯示 6 張 (左3右3)
        const itemsPerSpread = POKEDEX_CONFIG.ITEMS_PER_SPREAD || 6;
        const startIdx = this.currentPage * itemsPerSpread;

        // 渲染左頁 (3張)
        for (let i = 0; i < 3; i++) {
            const pokeData = machineInventory[startIdx + i];
            if (pokeData) {
                leftPageEl.innerHTML += this.createEntryHtml(pokeData);
            }
        }

        // 渲染右頁 (3張)
        for (let i = 3; i < 6; i++) {
            const pokeData = machineInventory[startIdx + i];
            if (pokeData) {
                rightPageEl.innerHTML += this.createEntryHtml(pokeData);
            }
        }

        // 更新頁碼資訊
        const totalPages = Math.ceil(machineInventory.length / itemsPerSpread);
        if (pageInfoEl) {
            pageInfoEl.innerText = `第 ${this.currentPage + 1} / ${totalPages} 頁`;
        }
    },

    // 3. 條目渲染器：處理剪影與全彩邏輯
    createEntryHtml(poke) {
        const isCaught = this.caughtIds.includes(poke.id);
        const isSeen = this.seenIds.includes(poke.id) || isCaught;
        
        // 狀態判斷
        let contentHtml = '';
        let statusClass = 'locked';

        if (isCaught) {
            // 已收服：全彩顯示
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
            // 已遇見：剪影顯示
            statusClass = 'seen';
            contentHtml = `
                <img src="${GAME_CONFIG.ASSET_PATH}${poke.id}.png" class="pokedex-img silhouette">
                <div class="pokedex-info">
                    <span class="pokedex-id">No.${poke.id.toString().padStart(3, '0')}</span>
                    <div class="pokedex-name">???</div>
                </div>
            `;
        } else {
            // 未發現：空白/問號
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

    // 4. 換頁控制
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

    // 5. 更新頂部統計數據
    updateStats() {
        const countEl = document.getElementById('pokedex-count');
        if (countEl) {
            countEl.innerText = `${this.caughtIds.length} / ${machineInventory.length}`;
        }
    }
};

// --- 🌟 V8.0 橋接函數：供 index.html 呼叫 ---
function openPokedex() {
    PokedexSystem.open();
}

function closePokedex() {
    currentScreen = 'selection';
    if(typeof GameUI !== 'undefined') GameUI.switchPage('selection-page');
}
