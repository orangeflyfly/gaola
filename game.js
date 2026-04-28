// game.js - V8.5.3 閃耀捕獲對接版 (流程修正版)

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

    buyPokemon(p, cost) {
        if (coins < cost) return alert("金幣不足！");

        const processCapture = () => {
            coins -= cost;
            
            p.image = `${GAME_CONFIG.ASSET_PATH}${p.id}.png`;
            const data = machineInventory.find(i => i.id === p.id);
            if(data) {
                p.skill = data.skill;
                p.type = data.type;
            }

            const exists = myBackpack.find(item => item.id === p.id);
            if (exists) { 
                let refund = p.rarity * 10; 
                coins += refund; 
                alert(`獲得重複卡匣！已轉化為 ${refund} 金幣。`); 
            } else { 
                myBackpack.push(p); 
                if(typeof GameStorage !== 'undefined') {
                    GameStorage.updatePokedex(p.id, 'caught');
                }
            }
            
            this.updateAll();

            if (currentScreen === 'guaranteed') {
                if(typeof BattleSystem !== 'undefined') BattleSystem.initPrep(null); 
            } else {
                this.finish();
            }
        };

        if(typeof EffectSystem !== 'undefined') {
            EffectSystem.playCaptureRitual(processCapture);
        } else {
            processCapture();
        }
    },

    // 🌟 [修正] 調整加賽判定時機
    finish() {
        // 🚀 修正：不要在這裡切換 switchPage('selection-page')
        const extraChance = GAME_CONFIG.EXTRA_BATTLE_RATE || 0.6;
        
        if(!isExtraBattle && Math.random() < extraChance) { 
            // 留在當前捕獲頁面，彈出加賽視窗
            document.getElementById('extra-battle-pop').classList.remove('hidden'); 
        } else { 
            // 沒有加賽，才回到大廳
            this.goToLobby(); 
        }
    },

    // 🌟 [新增] 專門處理回到大廳的邏輯
    goToLobby() {
        isExtraBattle = false;
        currentScreen = 'selection';
        if(typeof GameUI !== 'undefined') {
            GameUI.switchPage('selection-page');
        }
        // 如果總監希望徹底重置，可以解除下面註解
        // this.reload(); 
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

// 🌟 [修正] 放棄加賽或關閉彈窗時，呼叫 goToLobby
function hideExtraPop() { App.goToLobby(); } 

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
