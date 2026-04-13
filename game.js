let state = GameStorage.load();
let coins = state.coins;
let myBackpack = state.backpack;
let myPartner = state.partner || { id: 25, name: "皮卡丘", rarity: 3, image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png" };
let currentScreen = 'selection', playerHP = 100, enemyHP = 100, playerATB = 0, enemyATB = 0;
let currentEnemy = null, isPaused = false, isExtraBattle = false, currentRotation = 0, isRouletteRunning = false, currentMapOptions = [];

const App = {
    init() { MapSystem.refresh(); this.updateAll(); SoundSystem.playBGM('bgm_lobby'); },
    updateAll() { GameUI.updateDisplay(coins, playerHP, enemyHP, playerATB, enemyATB, myPartner); GameStorage.save(coins, myBackpack, myPartner); },
    buyPokemon(p, cost) {
        if (coins < cost) return alert("金幣不足！");
        coins -= cost;
        if (myBackpack.find(item => item.id === p.id)) { let r = p.rarity * 10; coins += r; alert(`重複！轉化為 ${r} 金幣。`); }
        else { myBackpack.push(p); alert(`收服 ${p.name}！`); }
        this.updateAll();
        if (currentScreen === 'guaranteed') document.getElementById('guaranteed-page').classList.add('hidden'), BattleSystem.start(null);
        if (currentScreen === 'roulette') this.finish();
    },
    finish() {
        document.getElementById('roulette-page').classList.add('hidden');
        if(!isExtraBattle && Math.random() < GAME_CONFIG.EXTRA_BATTLE_RATE) { document.getElementById('extra-battle-pop').classList.remove('hidden'); }
        else { this.reload(); }
    },
    reload() { location.reload(); }
};

function earnCoins() { coins += 10; SoundSystem.play('button_click'); App.updateAll(); }
function confirmMapSelection() { if (coins < 30) return alert("金幣不足！"); coins -= 30; SoundSystem.play('coin_in'); SoundSystem.playBGM('bgm_battle'); MapSystem.showGuaranteed(); }
function changeMap(dir) { MapSystem.change(dir); }
function spinWheel() { CaptureSystem.spin(); }
function startExtraBattle() { document.getElementById('extra-battle-pop').classList.add('hidden'); isExtraBattle = true; BattleSystem.start(null); }
function hideExtraPop() { App.reload(); }
function refreshMachine() { MapSystem.refresh(); }
function openBackpack() { document.getElementById('backpack-page').classList.remove('hidden'); renderBackpack(); }
function closeBackpack() { document.getElementById('backpack-page').classList.add('hidden'); }
function renderBackpack() {
    const g = document.getElementById('backpack-grid'); g.innerHTML = "";
    myBackpack.forEach(p => {
        let isP = (myPartner.id === p.id);
        const d = document.createElement('div'); d.className = `backpack-item ${p.rarity >= 6 ? 'rarity-6' : ''}`;
        d.style.cssText = "background:#222; padding:15px; border:3px solid #555; border-radius:15px; position:relative;";
        d.innerHTML = `${isP ? '<div class="partner-tag" style="position:absolute; top:-10px; right:-10px; background:#ff5722; padding:4px 8px; border-radius:8px; font-size:12px;">出戰中</div>' : ''}
            <img src="${p.image}" style="width:70px"><br><b>${p.name}</b><br>★${p.rarity}<br>
            <button onclick="setPartner(${p.id})" ${isP ? 'disabled' : ''}>${isP ? '選擇中' : '出戰'}</button>`;
        g.appendChild(d);
    });
}
function setPartner(id) { myPartner = myBackpack.find(p => p.id === id); App.updateAll(); renderBackpack(); }

App.init();
window.addEventListener('keydown', (e) => {
    if (currentScreen === 'fight' && !isPaused && (e.key === 'a' || e.key === 'd')) { playerATB += 4; App.updateAll(); }
});
