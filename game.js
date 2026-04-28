// game.js - V7.4 視覺與策略對接正式版 (全代碼不簡化)

const imageBaseUrl = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/";

// 載入存檔與初始化變數
let state = GameStorage.load();
let coins = state.coins;
let myBackpack = state.backpack || [];
// 確保夥伴資料完整
let myPartner = state.partner || { id: 25, name: "皮卡丘", rarity: 3, type: "電", skill: "十萬伏特", image: `${imageBaseUrl}25.png` };

let currentScreen = 'selection', playerHP = 100, enemyHP = 100, playerATB = 0, enemyATB = 0;
let currentEnemy = null, isPaused = false, isExtraBattle = false;

const App = {
    init() { 
        console.log("機台啟動中...");
        // 強制修復夥伴與圖片路徑，確保符合 V7.4 規格
        if(myPartner) {
            myPartner.image = `${imageBaseUrl}${myPartner.id}.png`;
            // 如果夥伴沒有技能名稱，從資料庫補齊 (防呆)
            if(!myPartner.skill) {
                const data = machineInventory.find(i => i.id === myPartner.id);
                if(data) myPartner.skill = data.skill;
            }
        }
        
        // 刷新地圖內容
        if(typeof MapSystem !== 'undefined') MapSystem.refresh(); 
        
        this.updateAll(); 
        
        // 延遲播放背景音樂
        setTimeout(() => { 
            if(typeof SoundSystem !== 'undefined') SoundSystem.playBGM('bgm_lobby'); 
        }, 1000);
    },

    // 更新金幣顯示、同步存檔
    updateAll() { 
        const coinEl = document.getElementById('coin-count');
        if(coinEl) coinEl.innerText = coins;
        
        // 同步 UI 顯示
        if(typeof GameUI !== 'undefined') {
            GameUI.updateDisplay(coins, playerHP, enemyHP, playerATB, enemyATB, myPartner, currentEnemy); 
        }
        
        // 保存到 LocalStorage
        GameStorage.save(coins, myBackpack, myPartner); 
    },

    // 處理收服寶可夢 (三選一或戰後捕獲)
    buyPokemon(p, cost) {
        if (coins < cost) return alert("金幣不足！");
        coins -= cost;
        
        // 強制設定高清圖片與技能
        p.image = `${imageBaseUrl}${p.id}.png`;
        const data = machineInventory.find(i => i.id === p.id);
        if(data) p.skill = data.skill;

        // 檢查背包是否重複
        const exists = myBackpack.find(item => item.id === p.id);
        if (exists) { 
            let r = p.rarity * 10; 
            coins += r; 
            alert(`獲得重複卡匣！已自動轉化為 ${r} 金幣。`); 
        } else { 
            myBackpack.push(p); 
            alert(`成功收服 ${p.name}！已存入卡匣收集冊。`); 
        }
        
        this.updateAll();

        // 🌟 [V7.4 修正] 跳轉邏輯：從三選一結束後進入戰鬥準備
        if (currentScreen === 'guaranteed') {
            document.getElementById('guaranteed-page').classList.add('hidden');
            if(typeof BattleSystem !== 'undefined') {
                // 進入 V7.4 戰前準備畫面
                BattleSystem.initPrep(null); 
            }
        } else if (currentScreen === 'roulette' || currentScreen === 'capture') {
            this.finish();
        }
    },

    // 結束本局遊戲，判斷是否加賽
    finish() {
        const ids = ['roulette-page', 'pay-confirm-box', 'fail-exit-btn', 'roulette-result', 'fighting-page'];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if(el) el.classList.add('hidden');
        });

        // 30% 機率觸發強大氣息加賽
        if(!isExtraBattle && Math.random() < 0.3) { 
            document.getElementById('extra-battle-pop').classList.remove('hidden'); 
        } else { 
            this.reload(); 
        }
    },

    reload() { location.reload(); }
};

// --- 全域橋樑函數 (對接 index.html 按鈕) ---

function earnCoins() { 
    coins += 100; 
    if(typeof SoundSystem !== 'undefined') SoundSystem.play('button_click'); 
    App.updateAll(); 
}

// 🌟 [V7.4 修正] 地圖選擇按鈕，統一交由 MapSystem 處理
function confirmMapSelection() { 
    if(typeof MapSystem !== 'undefined') {
        MapSystem.confirmSelection(); 
    }
}

function changeMap(dir) { MapSystem.change(dir); }

function spinWheel() { if(typeof CaptureSystem !== 'undefined') CaptureSystem.spin(); }

// 🌟 [V7.4 修正] 加賽場啟動邏輯
function startExtraBattle() { 
    document.getElementById('extra-battle-pop').classList.add('hidden'); 
    isExtraBattle = true; 
    if(typeof BattleSystem !== 'undefined') {
        BattleSystem.initPrep(null); // 加賽也要先準備
    }
}

function hideExtraPop() { App.reload(); }
function finishCapture() { App.finish(); }
function refreshMachine() { MapSystem.refresh(); }

// 背包 UI 控制
function openBackpack() { 
    currentScreen = 'backpack';
    document.getElementById('backpack-page').classList.remove('hidden'); 
    renderBackpack(); 
}

function closeBackpack() { 
    currentScreen = 'selection';
    document.getElementById('backpack-page').classList.add('hidden'); 
}

// 渲染背包 (主畫面版)
function renderBackpack() {
    const g = document.getElementById('backpack-grid');
    if(!g) return;
    g.innerHTML = "";
    
    myBackpack.forEach(p => {
        let isP = (myPartner && myPartner.id === p.id);
        const d = document.createElement('div');
        d.className = `backpack-item ${p.rarity >= 6 ? 'rarity-6' : ''}`;
        d.innerHTML = `
            <img src="${imageBaseUrl}${p.id}.png" class="poke-sprite">
            <div class="card-info">
                <b>${p.name}</b><br>
                <span style="color:#ffeb3b; font-weight:bold;">★ ${p.rarity}</span><br>
                <button onclick="setPartner(${p.id})" ${isP ? 'disabled' : ''} 
                        style="margin-top:5px; background: ${isP ? '#555' : 'linear-gradient(to bottom, #00fbff, #008183)'}; color: ${isP ? '#aaa' : '#000'};">
                    ${isP ? '出戰中' : '選擇出戰'}
                </button>
            </div>
        `;
        g.appendChild(d);
    });
}

// 設定出戰夥伴
function setPartner(id) { 
    const found = myBackpack.find(p => p.id === id);
    if(found) {
        myPartner = found; 
        App.updateAll(); 
        renderBackpack(); 
    }
}

// 初始化啟動
App.init();

// --- 全域按鍵監聽 ---
window.addEventListener('keydown', (e) => {
    // 🌟 [V7.4 修正] 戰鬥中的 A/D 鍵邏輯已由 BattleSystem 接手，這裡不再處理，避免衝突
    
    // 大廳地圖快速切換
    if (currentScreen === 'selection') {
        if (e.key === 'ArrowLeft') changeMap(-1);
        if (e.key === 'ArrowRight') changeMap(1);
        if (e.key === 'Enter') confirmMapSelection();
    }
});
