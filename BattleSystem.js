// BattleSystem.js - V7.2 街機魂進化旗艦版 (全代碼)

const BattleSystem = {
    // 🌟 [V7.2 新增] Combo 狀態管理
    comboCount: 0,
    comboTimer: null,

    // 1. 戰鬥啟動
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

        // 初始化數值
        playerHP = 100; enemyHP = 100; playerATB = 0; enemyATB = 0;
        isPaused = false;
        
        // 🌟 [V7.2 重置 Combo]
        this.comboCount = 0;
        if(this.comboTimer) clearTimeout(this.comboTimer);
        GameUI.updateCombo(0);

        // UI 切換
        document.getElementById('selection-page').classList.add('hidden');
        document.getElementById('fighting-page').classList.remove('hidden');

        // 更新圖片與名稱
        document.getElementById('player-name').innerText = myPartner.name;
        document.getElementById('player-icon').src = myPartner.image;
        document.getElementById('player-racer-img').src = myPartner.image;

        document.getElementById('enemy-name').innerText = currentEnemy.name;
        document.getElementById('enemy-icon').src = currentEnemy.image;
        document.getElementById('enemy-racer-img').src = currentEnemy.image;

        // 🌟 [V7.2 核心] 重構 A/D 鍵連打引擎與 FEVER 系統
        window.onkeydown = (e) => {
            if (currentScreen === 'fight' && !isPaused) {
                const key = e.key.toLowerCase();
                if (key === 'a' || key === 'd') {
                    
                    // 1. 物理震動回饋
                    GameUI.shakeImpact('player-card');

                    // 2. Combo 計算邏輯
                    this.comboCount++;
                    GameUI.updateCombo(this.comboCount);

                    // 如果 1.5 秒內沒有繼續按，Combo 歸零
                    if (this.comboTimer) clearTimeout(this.comboTimer);
                    this.comboTimer = setTimeout(() => {
                        this.comboCount = 0;
                        GameUI.updateCombo(0);
                    }, 1500);

                    // 3. FEVER 爆發加速邏輯
                    let atbGain = 1.8;
                    if (this.comboCount >= 30) {
                        atbGain *= 1.2; // FEVER 狀態 1.2 倍速
                    }
                    playerATB += atbGain; 
                    
                    // 顯示加速提示
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

    // 3. 戰鬥循環
    loop() {
        if (currentScreen !== 'fight' || isPaused) return;

        // 🌟 [V7.2 修復] 極低怠速，逼迫玩家手動連打
        playerATB += 0.005; 
        
        // 敵方維持正常速度 (依據稀有度產生難度)
        enemyATB += (0.25 + (currentEnemy.rarity * 0.06));

        // 🌟 [V7.2 關鍵邊界校準] 同時更新 left 與 translate 百分比，確保頭像鎖定在賽道內
        const pRacer = document.getElementById('player-racer');
        const eRacer = document.getElementById('enemy-racer');
        
        // 🌟 [絕對鎖定公式] 同步套用在戰鬥循環中
        const pRacer = document.getElementById('player-racer');
        const eRacer = document.getElementById('enemy-racer');
        
        pRacer.style.left = `calc(${playerATB}% - ${playerATB * 0.9}px)`;
        eRacer.style.left = `calc(${enemyATB}% - ${enemyATB * 0.9}px)`;

        // 判定進度條
        if (playerATB >= 100) {
            this.executeAttack('player');
        } else if (enemyATB >= 100) {
            this.executeAttack('enemy');
        }

        requestAnimationFrame(() => this.loop());
    },

    // 4. 攻擊執行
    executeAttack(attacker) {
        isPaused = true;
        let baseDamage = (attacker === 'player') ? 20 : 15;
        let multiplier = 1.0;
        let isMiss = false;

        // 🌟 [V7.2 新增] 隨機閃避系統 (敵方星等越高，越會閃避我方攻擊)
        let dodgeChance = (attacker === 'player') ? (currentEnemy.rarity * 2) : 5; 
        if (Math.random() * 100 < dodgeChance) isMiss = true;

        if (attacker === 'player') {
            multiplier = getDamageMultiplier(myPartner.type, currentEnemy.type);
            let finalDmg = isMiss ? 0 : Math.floor(baseDamage * multiplier);
            
            // 播報字串判定
            if (isMiss) this.showMsg(`💨 敵方 ${currentEnemy.name} 閃開了攻擊！`);
            else if (multiplier > 1) this.showMsg(`🔥 效果絕佳！ ${myPartner.name} 攻擊！`);
            else if (multiplier < 1) this.showMsg(`❄️ 效果不好... ${myPartner.name} 攻擊`);
            else this.showMsg(`💥 ${myPartner.name} 攻擊！`);
            
            enemyHP -= finalDmg;
            GameUI.showDamage('enemy-card', finalDmg, multiplier);
        } else {
            multiplier = getDamageMultiplier(currentEnemy.type, myPartner.type);
            let finalDmg = isMiss ? 0 : Math.floor(baseDamage * multiplier);

            // 播報字串判定
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
        // 戰鬥結束，清空 Combo 狀態
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
