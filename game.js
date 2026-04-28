// game.js - V8.5 閃耀捕獲對接版 (指揮中樞)

let state = GameStorage.load();
let coins = state.coins;
let myBackpack = state.backpack || [];
let myPartner = state.partner || { id: 25, name: "皮卡丘", rarity: 3, type: "電", skill: "十萬伏特" };

let currentScreen = 'selection', playerHP = 100, enemyHP = 100, playerATB = 0, enemyATB = 0;
let currentEnemy = null, isPaused = false, isExtraBattle = false;

const App = {
    init() { 
        console.log("V8.5 閃耀中樞啟動...");
        if(myPartner) {
            myPartner.image = `${GAME_CONFIG.ASSET_PATH}${myPartner.id}.png`;
            if(!myPartner.skill) {
                const data = machineInventory.find(i => i.id === myPartner.id);
                if(data) myPartner.skill = data.skill;
            }
        }
        if(typeof MapSystem !== 'undefined') MapSystem.refresh(); 
        this.updateAll(); 
        setTimeout(() => { 
            if(typeof SoundSystem !== 'undefined') SoundSystem.playBGM('bgm_lobby'); 
        }, 1000);
    },

    updateAll() { 
        GameStorage.save(coins, myBackpack, myPartner); 
        if(typeof GameUI !== 'undefined') {
            GameUI.updateDisplay(coins, playerHP, enemyHP, playerATB, enemyATB, myPartner, currentEnemy); 
        }
    },

    // 🌟 [V8.5 重大更新] 收服邏輯對接入包儀式
    buyPokemon(p, cost) {
        if (coins < cost) return alert("金幣不足！");

        // 1. 準備收服成功的內部邏輯 (等儀式演完才執行)
        const processCapture = () => {
            coins -= cost;
            
            // 格式化資料
            p.image = `${GAME_CONFIG.ASSET_PATH}${p.id}.png`;
            const data = machineInventory.find(i => i.id === p.id);
            if(data) {
                p.skill = data.skill;
                p.type = data.type;
            }

            // 背包與圖鑑同步
            const exists = myBackpack.find(item => item.id === p.id);
            if (exists) { 
                let refund = p.rarity * 10; 
                coins += refund; 
                alert(`獲得重複卡匣！已轉化為 ${refund} 金幣。`); 
            } else { 
                myBackpack.push(p); 
                // 🌟 同步更新典藏之書
                if(typeof GameStorage !== 'undefined') {
                    GameStorage.updatePokedex(p.id, 'caught');
                }
            }
            
            this.updateAll();

            // 跳轉判定
            if (currentScreen === 'guaranteed') {
                if(typeof BattleSystem !== 'undefined') BattleSystem.initPrep(null); 
            } else {
                this.finish();
            }
        };

        // 2. 啟動視覺大師演出
        if(typeof EffectSystem !== 'undefined') {
            // 呼叫黑屏虹光儀式，演完後執行上述邏輯
            EffectSystem.playCaptureRitual(processCapture);
        } else {
            // 如果沒特效系統，直接走邏輯 (防呆)
            processCapture();
        }
    },

    finish() {
        GameUI.switchPage('selection-page');
        const extraChance = GAME_CONFIG.EXTRA_BATTLE_RATE || 0.6;
        if(!isExtraBattle && Math.random() < extraChance) { 
            document.getElementById('extra-battle-pop').classList.remove('hidden'); 
        } else { 
            this.reload(); 
        }
    },

    reload() { location.reload(); }
};

// --- 橋樑函數 ---

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

function openBackpack() { 
    currentScreen = 'backpack';
    GameUI.switchPage('backpack-page');
    if(typeof GameUI !== 'undefined') GameUI.renderBackpack(myBackpack); 
}

function closeBackpack() { 
    currentScreen = 'selection';
    GameUI.switchPage('selection-page');
}

function setPartner(id) { 
    const found = myBackpack.find(p => p.id === id);
    if(found) {
        myPartner = found; 
        App.updateAll(); 
        if(typeof GameUI !== 'undefined') GameUI.renderBackpack(myBackpack); 
    }
}

function spinWheel() { if(typeof CaptureSystem !== 'undefined') CaptureSystem.spin(); }
function hideExtraPop() { App.reload(); }
function finishCapture() { App.finish(); }
function refreshMachine() { if(typeof MapSystem !== 'undefined') MapSystem.refresh(); }

App.init();

window.addEventListener('keydown', (e) => {
    if (currentScreen === 'selection') {
        const key = e.key;
        if (key === 'ArrowLeft') changeMap(-1);
        if (key === 'ArrowRight') changeMap(1);
        if (key === 'Enter') confirmMapSelection();
    }
});
