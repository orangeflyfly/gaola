// game.js - V9.0.5 營業閉環與黑屏重置版 (全代碼不簡化)

let state = GameStorage.load();
let coins = state.coins;
let myBackpack = state.backpack || [];
let myPartner = state.partner || { id: 25, name: "皮卡丘", rarity: 3, type: "電", skill: "十萬伏特" };

let currentScreen = 'selection', playerHP = 100, enemyHP = 100, playerATB = 0, enemyATB = 0;
let currentEnemy = null, isPaused = false, isExtraBattle = false;

const App = {
    init() { 
        console.log("V9.0.5 街機中樞啟動...");
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

    // 負責處理輪盤捕獲後的結算與入包
    buyPokemon(p, cost) {
        if (coins < cost) return alert("金幣不足！請去打工。");

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
                alert(`獲得重複卡匣！已化為 ${refund} 星塵金幣。`); 
            } else { 
                myBackpack.push(p); 
                if(typeof GameStorage !== 'undefined') {
                    GameStorage.updatePokedex(p.id, 'caught');
                }
            }
            
            this.updateAll();

            // 完成捕獲後，進入加賽或結束判定
            this.finish();
        };

        if(typeof EffectSystem !== 'undefined') {
            EffectSystem.playCaptureRitual(processCapture);
        } else {
            processCapture();
        }
    },

    finish() {
        const extraChance = GAME_CONFIG.EXTRA_BATTLE_RATE || 0.6;
        
        // 捕獲失敗 (沒抓到) 或 已經是加賽場 -> 直接回大廳
        if(!isExtraBattle && Math.random() < extraChance) { 
            // 彈出加賽視窗
            document.getElementById('extra-battle-pop').classList.remove('hidden'); 
        } else { 
            this.goToLobby(); 
        }
    },

    // 🌟 [修正] 處理回到大廳與機台待機重置的邏輯
    goToLobby() {
        isExtraBattle = false;
        currentScreen = 'selection';
        
        if(typeof GameUI !== 'undefined') {
            GameUI.switchPage('selection-page');
            document.getElementById('extra-battle-pop').classList.add('hidden'); // 確保加賽視窗關閉
        }

        // 🌟 重置機台狀態，蓋回「請投幣」黑屏
        if(typeof MapSystem !== 'undefined') {
            MapSystem.isAwake = false; // 重設大腦狀態
            
            const standby = document.getElementById('standby-screen');
            if(standby) standby.classList.remove('hidden'); // 蓋回黑屏

            const screen = document.getElementById('main-screen');
            if(screen) {
                screen.classList.remove('screen-wake');
                screen.classList.add('screen-off'); // 準備下一次覺醒
            }

            // 按鈕文字復原
            const physicalBtn = document.querySelector('.btn-red');
            if(physicalBtn) physicalBtn.innerText = "🔴 投幣 30 啟動";

            // 換一批新地圖吸引下一位玩家
            MapSystem.refresh();
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
    
    // 隨機抽一隻更強的怪進行加賽
    let p = machineInventory[Math.floor(Math.random() * machineInventory.length)];
    const imageBaseUrl = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/";
    let extraEnemy = { ...p, image: `${imageBaseUrl}${p.id}.png` };
    
    if(typeof BattleSystem !== 'undefined') BattleSystem.initPrep(extraEnemy); 
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
