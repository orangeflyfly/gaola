// game.js - 遊戲的所有邏輯與大腦
let currentScreen = 'selection'; 
let currentMapOptions = [];      
let currentMapIndex = 0;         
let currentEnergy = 0;
let battleLoop = null;

async function initMachine() {
    document.getElementById('single-map-display').innerHTML = '<h3 style="color: #aaa; font-size: 24px;">📡 正在下載官方圖片...</h3>';
    currentMapOptions = [];
    
    for (let i = 0; i < 5; i++) {
        let randomPoke = machineInventory[Math.floor(Math.random() * machineInventory.length)];
        try {
            let response = await fetch(`https://pokeapi.co/api/v2/pokemon/${randomPoke.id}`);
            let apiData = await response.json();
            let officialImageUrl = apiData.sprites.other['official-artwork'].front_default;
            
            currentMapOptions.push({
                id: randomPoke.id,
                name: randomPoke.name,
                rarity: randomPoke.rarity,
                image: officialImageUrl
            });
        } catch (error) {
            console.log("網路連線失敗，無法取得圖片");
        }
    }

    currentMapIndex = 0;
    currentScreen = 'selection';
    document.getElementById('selection-page').classList.remove('hidden');
    document.getElementById('battle-page').classList.add('hidden');
    document.getElementById('fighting-page').classList.add('hidden');
    
    renderCarousel();
}

function renderCarousel() {
    const display = document.getElementById('single-map-display');
    const data = currentMapOptions[currentMapIndex];
    const silhouette = (data.rarity >= 4) ? "silhouette" : "";
    
    display.innerHTML = `
        <div class="map-card">
            <img src="${data.image}" class="poke-sprite ${silhouette}" alt="${data.name}">
            <div style="font-size: 28px; font-weight: bold;">地圖 ${currentMapIndex + 1}</div>
            <div style="font-size: 20px; color: #aaa; margin-top: 15px;">${data.name}</div>
        </div>
    `;
}

function changeMap(direction) {
    currentMapIndex = (currentMapIndex + direction + 5) % 5;
    renderCarousel();
}

function confirmMapSelection() {
    enterTripleChoice(currentMapOptions[currentMapIndex]);
}

function enterTripleChoice(boss) {
    currentScreen = 'triple';
    document.getElementById('selection-page').classList.add('hidden');
    document.getElementById('battle-page').classList.remove('hidden');
    
    let choices = [boss];
    while(choices.length < 3) {
        let r = currentMapOptions[Math.floor(Math.random() * currentMapOptions.length)];
        if(!choices.find(p => p.id === r.id)) choices.push(r);
    }

    const screen = document.getElementById('battle-select-screen');
    screen.innerHTML = "";
    choices.forEach(p => {
        const choiceCard = document.createElement('div');
        choiceCard.className = 'choice-card';
        choiceCard.onclick = () => startFighting(p);
        
        choiceCard.innerHTML = `
            <img src="${p.image}" class="poke-sprite" alt="${p.name}">
            <div style="font-size: 24px; font-weight: bold;">${p.name}</div>
            <div style="font-size: 18px; color: yellow; margin-top: 10px;">★${p.rarity}</div>
        `;
        screen.appendChild(choiceCard);
    });
}

function backToMaps() {
    currentScreen = 'selection';
    document.getElementById('selection-page').classList.remove('hidden');
    document.getElementById('battle-page').classList.add('hidden');
}

function startFighting(target) {
    currentScreen = 'fight';
    document.getElementById('battle-page').classList.add('hidden');
    document.getElementById('fighting-page').classList.remove('hidden');
    
    document.getElementById('enemy-title').innerText = "正在挑戰 " + target.name;
    document.getElementById('enemy-icon').src = target.image; 
    
    currentEnergy = 0;
    if(battleLoop) clearInterval(battleLoop);
    battleLoop = setInterval(() => {
        if (currentScreen === 'fight' && currentEnergy > 0) {
            currentEnergy -= 0.8; 
            updateUI();
        }
    }, 100);
}

window.addEventListener('keydown', (e) => {
    const key = e.key;
    if (currentScreen === 'selection') {
        if (key === 'ArrowLeft') changeMap(-1);
        if (key === 'ArrowRight') changeMap(1);
        if (key === 'Enter') confirmMapSelection();
    } else if (currentScreen === 'triple') {
        if (key === 'Escape') backToMaps();
    } else if (currentScreen === 'fight') {
        const lowerKey = key.toLowerCase();
        if (lowerKey === 'a' || lowerKey === 'd') {
            currentEnergy += 4;
            if (currentEnergy >= 100) {
                currentEnergy = 100;
                clearInterval(battleLoop);
                setTimeout(() => {
                    alert("究極攻擊成功！成功收服！");
                    initMachine();
                }, 100);
            }
            updateUI();
        }
    }
});

function updateUI() {
    const bar = document.getElementById('energy-bar');
    bar.style.width = currentEnergy + "%";
    document.getElementById('energy-text').innerText = Math.floor(currentEnergy);
}

window.onload = initMachine;
