// game.js - V8.0 大師架構重組版 (指揮中樞)

// 🌟 [V8.0 優化] 所有的狀態變數現在統一由 App 管理
let state = GameStorage.load();
let coins = state.coins;
let myBackpack = state.backpack || [];
let myPartner = state.partner || { id: 25, name: "皮卡丘", rarity: 3, type: "電", skill: "十萬伏特" };

// 戰鬥狀態變數
let currentScreen = 'selection', playerHP = 100, enemyHP = 100, playerATB = 0, enemyATB = 0;
let currentEnemy = null, isPaused = false, isExtraBattle = false;

const App = {
    // 1. 系統初始化
    init() { 
        console.log("V8.0 指揮中心啟動...");
        
        // 自動修復與補齊夥伴資料 (對齊 config 路徑與技能資料庫)
        if(myPartner) {
            myPartner.image = `${GAME_CONFIG.ASSET_PATH}${myPartner.id}.png`;
            if(!myPartner.skill) {
                const data = machineInventory.find(i => i.id === myPartner.id);
                if(data) myPartner.skill = data.skill;
            }
        }
        
        // 刷新地圖與啟動大廳音樂
        if(typeof MapSystem !== 'undefined') MapSystem.refresh(); 
        this.updateAll(); 
        
        setTimeout(() => { 
            if(typeof SoundSystem !== 'undefined') SoundSystem.playBGM('bgm_lobby'); 
        }, 1000);
    },

    // 2. 數據與 UI 同步中樞
    updateAll() { 
        // 同步存檔
        GameStorage.save(coins, myBackpack, myPartner); 

        // 呼叫 UI 更新顯示
        if(typeof GameUI !== 'undefined') {
            GameUI.updateDisplay(coins, playerHP, enemyHP, playerATB, enemyATB, myPartner, currentEnemy); 
        }
    },

    // 3. 收服與購買邏輯 (簡化路徑與跳轉)
    buyPokemon(p, cost) {
        if (coins < cost) return alert("金幣不足！");
        coins -= cost;
        
        // 統一資料格式
        p.image = `${GAME_CONFIG.ASSET_PATH}${p.id}.png`;
        const data = machineInventory.find(i => i.id === p.id);
        if(data) {
            p.skill = data.skill;
            p.type = data.type;
        }

        // 背包查重與轉化邏輯
        const exists = myBackpack.find(item => item.id === p.id);
        if (exists) { 
            let refund = p.rarity * 10; 
            coins += refund; 
            alert(`獲得重複卡匣！已轉化為 ${refund} 金幣。`); 
        } else { 
            myBackpack.push(p); 
            alert(`成功收服 ${p.name}！已錄入典藏之書。`); 
        }
        
        this.updateAll();

        // 🌟 [V8.0 優化] 使用標準化頁面切換
        if (currentScreen === 'guaranteed') {
            if(typeof BattleSystem !== 'undefined') BattleSystem.initPrep(null); 
        } else {
            this.finish();
        }
    },

    // 4. 遊戲流程結算
    finish() {
        // 🌟 [V8.0 優化] 一行指令關閉所有戰鬥相關頁面回到主選單
        GameUI.switchPage('selection-page');

        // 判定加賽 (使用 Config 設定值)
        const extraChance = GAME_CONFIG.EXTRA_BATTLE_RATE || 0.6;
        if(!isExtraBattle && Math.random() < extraChance) { 
            document.getElementById('extra-battle-pop').classList.remove('hidden'); 
        } else { 
            this.reload(); 
        }
    },

    reload() { location.reload(); }
};

// --- 🌟 V8.0 橋樑函數 (極簡化對接) ---

function earnCoins() { 
    coins += 100; 
    if(typeof SoundSystem !== 'undefined') SoundSystem.play('button_click'); 
    App.updateAll(); 
}

function confirmMapSelection() { 
    if(typeof MapSystem !== 'undefined') MapSystem.confirmSelection(); 
}

function changeMap(dir) { 
    if(typeof MapSystem !== 'undefined') MapSystem.change(dir); 
}

function startExtraBattle() { 
    document.getElementById('extra-battle-pop').classList.add('hidden'); 
    isExtraBattle = true; 
    if(typeof BattleSystem !== 'undefined') BattleSystem.initPrep(null); 
}

// 背包控制 (全面改用 switchPage)
function openBackpack() { 
    currentScreen = 'backpack';
    GameUI.switchPage('backpack-page');
    if(typeof GameUI !== 'undefined') GameUI.renderBackpack(myBackpack); 
}

function closeBackpack() { 
    currentScreen = 'selection';
    GameUI.switchPage('selection-page');
}

// 夥伴設定 (維持穩定)
function setPartner(id) { 
    const found = myBackpack.find(p => p.id === id);
    if(found) {
        myPartner = found; 
        App.updateAll(); 
        if(typeof GameUI !== 'undefined') GameUI.renderBackpack(myBackpack); 
    }
}

// 其他工具橋接
function spinWheel() { if(typeof CaptureSystem !== 'undefined') CaptureSystem.spin(); }
function hideExtraPop() { App.reload(); }
function finishCapture() { App.finish(); }
function refreshMachine() { if(typeof MapSystem !== 'undefined') MapSystem.refresh(); }

// 啟動 App
App.init();

// --- 全域按鍵監聽 (V8.0 優化版) ---
window.addEventListener('keydown', (e) => {
    if (currentScreen === 'selection') {
        const key = e.key;
        if (key === 'ArrowLeft') changeMap(-1);
        if (key === 'ArrowRight') changeMap(1);
        if (key === 'Enter') confirmMapSelection();
    }
});
