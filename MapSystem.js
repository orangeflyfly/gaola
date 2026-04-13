const MapSystem = {
    options: [],
    currentIndex: 0,
    async refresh() {
        currentMapOptions = [];
        // PokeAPI 官方繪圖的 RAW 來源，非常穩定
        const imageBaseUrl = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/";
        
        for (let i = 0; i < 5; i++) {
            let p = machineInventory[Math.floor(Math.random() * machineInventory.length)];
            // 替換：我們手動組合一個穩定的 RAW URL，直接指向 PokeAPI 託管在 GitHub 的 RAW 檔案
            currentMapOptions.push({ ...p, image: `${imageBaseUrl}${p.id}.png` });
        }
        this.currentIndex = 0; GameUI.renderCarousel(this.currentIndex, currentMapOptions);
    },
    change(dir) {
        SoundSystem.play('button_click');
        this.currentIndex = (this.currentIndex + dir + 5) % 5;
        GameUI.renderCarousel(this.currentIndex, currentMapOptions);
    },
    async showGuaranteed() {
        currentScreen = 'guaranteed';
        document.getElementById('selection-page').classList.add('hidden');
        document.getElementById('guaranteed-page').classList.remove('hidden');
        const container = document.getElementById('guaranteed-choices');
        container.innerHTML = "📡 正在產生候選名單...";
        let choices = [];
        for(let i=0; i<3; i++) {
            let p = machineInventory[Math.floor(Math.random() * machineInventory.length)];
            let resp = await fetch(`https://pokeapi.co/api/v2/pokemon/${p.id}`);
            let data = await resp.json();
            choices.push({ ...p, image: data.sprites.other['official-artwork'].front_default });
        }
        container.innerHTML = "";
        choices.forEach(p => {
            const div = document.createElement('div');
            div.className = `choice-card ${p.rarity >= 6 ? 'rarity-6' : ''}`;
            div.innerHTML = `<img src="${p.image}" class="poke-sprite"><br><b>${p.name}</b><br>★${p.rarity}<br>
                <button onclick="App.buyPokemon(${JSON.stringify(p).replace(/"/g, '&quot;')}, 0)" style="background:cyan; color:black; margin-top:10px;">免費領取</button>`;
            container.appendChild(div);
        });
    }
};
