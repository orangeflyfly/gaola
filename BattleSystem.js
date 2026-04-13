const BattleSystem = {
    loop: null,
    async start(target) {
        currentScreen = 'fight'; isPaused = false;
        document.getElementById('fighting-page').classList.remove('hidden');
        if(!target) {
            let roll = Math.random();
            let chances = isExtraBattle ? GAME_CONFIG.EXTRA_RARITY_CHANCE : GAME_CONFIG.RARITY_CHANCE;
            let targetRarity = 3;
            if (roll < (chances[6]||0)) targetRarity = 6;
            else if (roll < (chances[6]||0) + (chances[5]||0)) targetRarity = 5;
            else if (roll < (chances[6]||0) + (chances[5]||0) + (chances[4]||0)) targetRarity = 4;
            let pool = machineInventory.filter(p => p.rarity === targetRarity);
            let p = pool[Math.floor(Math.random() * pool.length)];
            let resp = await fetch(`https://pokeapi.co/api/v2/pokemon/${p.id}`);
            let data = await resp.json();
            currentEnemy = { ...p, image: data.sprites.other['official-artwork'].front_default };
        }
        const enemyCard = document.getElementById('enemy-card');
        if (currentEnemy.rarity >= 6) {
            enemyCard.classList.add('rarity-6'); SoundSystem.play('rarity_6_glow');
        } else { enemyCard.classList.remove('rarity-6'); }
        document.getElementById('enemy-icon').src = currentEnemy.image;
        document.getElementById('enemy-racer-img').src = currentEnemy.image;
        document.getElementById('enemy-name').innerText = currentEnemy.name;
        playerHP = 100; enemyHP = 100; playerATB = 0; enemyATB = 0;
        this.loop = setInterval(() => {
            if (currentScreen !== 'fight' || isPaused) return;
            playerATB += 0.45; enemyATB += (currentEnemy.rarity * 0.35);
            if (playerATB >= 92) this.triggerAttack('player');
            else if (enemyATB >= 92) this.triggerAttack('enemy');
            App.updateAll();
        }, 50);
    },
    triggerAttack(attacker) {
        isPaused = true; SoundSystem.play('attack_hit');
        if (attacker === 'player') { enemyHP -= 20; GameUI.showDamage('enemy-card', 20); GameUI.shake('enemy-card'); }
        else { playerHP -= 25; GameUI.showDamage('player-card', 25); GameUI.shake('player-card'); }
        App.updateAll();
        if (enemyHP <= 0 || playerHP <= 0) {
            clearInterval(this.loop);
            setTimeout(() => { if(enemyHP <= 0) CaptureSystem.start(); else App.reload(); }, 1200);
        } else {
            setTimeout(() => { if(attacker==='player') playerATB=0; else enemyATB=0; isPaused=false; }, 1200);
        }
    }
};
