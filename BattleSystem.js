// BattleSystem.js - V7.3 絕對防禦戰鬥大腦 (全代碼)

const BattleSystem = {
    comboCount: 0,
    comboTimer: null,

    start(enemyData) {
        currentScreen = 'fight';
        const imageBaseUrl = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/";
        
        if (!enemyData) {
            enemyData = machineInventory[Math.floor(Math.random() * machineInventory.length)];
        }
        
        currentEnemy = {
            ...enemyData,
            image: `${imageBaseUrl}${enemyData.id}.png`
        };
        
        myPartner.image = `${imageBaseUrl}${myPartner.id}.png`;

        playerHP = 100; enemyHP = 100; playerATB = 0; enemyATB = 0;
        isPaused = false;
        
        this.comboCount = 0;
        if(this.comboTimer) clearTimeout(this.comboTimer);
        GameUI.updateCombo(0);

        document.getElementById('selection-page').classList.add('hidden');
        document.getElementById('fighting-page').classList.remove('hidden');

        document.getElementById('player-name').innerText = myPartner.name;
        document.getElementById('player-icon').src = myPartner.image;
        document.getElementById('player-racer-img').src = myPartner.image;

        document.getElementById('enemy-name').innerText = currentEnemy.name;
        document.getElementById('enemy-icon').src = currentEnemy.image;
        document.getElementById('enemy-racer-img').src = currentEnemy.image;

        window.onkeydown = (e) => {
            if (currentScreen === 'fight' && !isPaused) {
                const key = e.key.toLowerCase();
                if (key === 'a' || key === 'd') {
                    
                    GameUI.shakeImpact('player-card');

                    this.comboCount++;
                    GameUI.updateCombo(this.comboCount);

                    if (this.comboTimer) clearTimeout(this.comboTimer);
                    this.comboTimer = setTimeout(() => {
                        this.comboCount = 0;
                        GameUI.updateCombo(0);
                    }, 1500);

                    let atbGain = 1.8;
                    if (this.comboCount >= 30) {
                        atbGain *= 1.2; 
                    }
                    playerATB += atbGain; 
                    
                    if (document.getElementById('action-msg').innerText.includes("加速")) {
                        this.showMsg("⚡ 請瘋狂連打A.D鍵！！ ⚡");
                    }
                }
            }
        };

        this.updateBars();
        this.loop();
        
        this.showMsg("⚡ 戰鬥開始！ ⚡");
    },

    showMsg(text) {
        const msgEl = document.getElementById('action-msg');
        if (msgEl) {
            msgEl.innerText = text;
            msgEl.style.animation = 'none';
            msgEl.offsetHeight; 
            msgEl.style.animation = 'actionPulse 0.4s ease-in-out infinite alternate';
        }
    },

    loop() {
        if (currentScreen !== 'fight' || isPaused) return;

        playerATB += 0.005; 
        enemyATB += (0.25 + (currentEnemy.rarity * 0.06));

        // 🌟 [V7.3 絕對鎖定公式] 直接在 loop 中使用 calc
        const pRacer = document.getElementById('player-racer');
        const eRacer = document.getElementById('enemy-racer');
        
        if (pRacer) pRacer.style.left = `calc(${playerATB}% - ${playerATB * 0.98}px)`;
        if (eRacer) eRacer.style.left = `calc(${enemyATB}% - ${enemyATB * 0.98}px)`;

        if (playerATB >= 100) {
            this.executeAttack('player');
        } else if (enemyATB >= 100) {
            this.executeAttack('enemy');
        }

        requestAnimationFrame(() => this.loop());
    },

    executeAttack(attacker) {
        isPaused = true;
        let baseDamage = (attacker === 'player') ? 20 : 15;
        let multiplier = 1.0;
        let isMiss = false;

        let dodgeChance = (attacker === 'player') ? (currentEnemy.rarity * 2) : 5; 
        if (Math.random() * 100 < dodgeChance) isMiss = true;

        if (attacker === 'player') {
            multiplier = getDamageMultiplier(myPartner.type, currentEnemy.type);
            let finalDmg = isMiss ? 0 : Math.floor(baseDamage * multiplier);
            
            if (isMiss) this.showMsg(`💨 敵方 ${currentEnemy.name} 閃開了攻擊！`);
            else if (multiplier > 1) this.showMsg(`🔥 效果絕佳！ ${myPartner.name} 攻擊！`);
            else if (multiplier < 1) this.showMsg(`❄️ 效果不好... ${myPartner.name} 攻擊`);
            else this.showMsg(`💥 ${myPartner.name} 攻擊！`);
            
            enemyHP -= finalDmg;
            GameUI.showDamage('enemy-card', finalDmg, multiplier);
        } else {
            multiplier = getDamageMultiplier(currentEnemy.type, myPartner.type);
            let finalDmg = isMiss ? 0 : Math.floor(baseDamage * multiplier);

            if (isMiss) this.showMsg(`💨 漂亮！ ${myPartner.name} 閃開了攻擊！`);
            else if (multiplier > 1) this.showMsg(`⚠️ 糟糕！敵方 ${currentEnemy.name} 強力一擊！`);
            else this.showMsg(`💥 敵方 ${currentEnemy.name} 攻擊！`);

            playerHP -= finalDmg;
            GameUI.showDamage('player-card', finalDmg, multiplier);
        }

        if (!isMiss) SoundSystem.play('attack_hit');
        this.updateBars();

        setTimeout(() => {
            if (enemyHP <= 0 || playerHP <= 0) {
                this.end();
            } else {
                if (attacker === 'player') playerATB = 0; else enemyATB = 0;
                isPaused = false;
                this.showMsg("請瘋狂按 A D 鍵加速！！");
                this.loop();
            }
        }, 1200);
    },

    updateBars() {
        GameUI.updateDisplay(coins, playerHP, enemyHP, playerATB, enemyATB, myPartner, currentEnemy);
    },

    end() {
        this.comboCount = 0;
        if(this.comboTimer) clearTimeout(this.comboTimer);
        GameUI.updateCombo(0);

        currentScreen = 'capture_prep';
        this.showMsg("戰鬥結束！準備捕捉...");
        
        setTimeout(() => {
            document.getElementById('fighting-page').classList.add('hidden');
            CaptureSystem.init(currentEnemy);
        }, 1500);
    }
};
