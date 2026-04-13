// BattleSystem.js - V7.1 手動連打與視覺校準版 (不簡化)

const BattleSystem = {
    // 1. 戰鬥啟動：新增按鍵監聽器
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

        // [關鍵] 重新綁定 A/D 鍵手動加速邏輯
        window.onkeydown = (e) => {
            if (currentScreen === 'fight' && !isPaused) {
                const key = e.key.toLowerCase();
                if (key === 'a' || key === 'd') {
                    // 每按一下增加 1.8%，增加連打的爆發感
                    playerATB += 1.8; 
                    // 為了不讓文字一直跳動，只有在平時顯示加速提示
                    if (document.getElementById('action-msg').innerText.includes("加速")) {
                        this.showMsg("⚡ 衝刺中！！ ⚡");
                    }
                }
            }
        };

        this.updateBars();
        this.loop();
        
        this.showMsg("⚡ 戰鬥開始！ ⚡");
    },

    // 2. 戰鬥公告：配合 CSS 2.2rem 大小
    showMsg(text) {
        const msgEl = document.getElementById('action-msg');
        if (msgEl) {
            msgEl.innerText = text;
            msgEl.style.animation = 'none';
            msgEl.offsetHeight; 
            msgEl.style.animation = 'actionPulse 0.4s ease-in-out infinite alternate';
        }
    },

    // 3. 核心邏輯：大幅調降自動增速，解決「自動戰鬥」Bug
    loop() {
        if (currentScreen !== 'fight' || isPaused) return;

        // [修正] 調降自動增加的速度 (從 0.4 降到 0.05)，現在不按鍵幾乎不動
        playerATB += 0.05; 
        
        // 敵方維持正常速度 (依據稀有度產生難度)
        enemyATB += (0.25 + (currentEnemy.rarity * 0.06));

        // 更新賽道圖標位置
        document.getElementById('player-racer').style.left = `${playerATB}%`;
        document.getElementById('enemy-racer').style.left = `${enemyATB}%`;

        // 判定進度條
        if (playerATB >= 95) {
            this.executeAttack('player');
        } else if (enemyATB >= 95) {
            this.executeAttack('enemy');
        }

        requestAnimationFrame(() => this.loop());
    },

    // 4. 攻擊執行 (保留屬性相剋邏輯)
    executeAttack(attacker) {
        isPaused = true;
        let baseDamage = (attacker === 'player') ? 20 : 15;
        let multiplier = 1.0;

        if (attacker === 'player') {
            multiplier = getDamageMultiplier(myPartner.type, currentEnemy.type);
            let finalDmg = Math.floor(baseDamage * multiplier);
            
            if (multiplier > 1) this.showMsg(`🔥 效果絕佳！ ${myPartner.name} 攻擊！`);
            else if (multiplier < 1) this.showMsg(`❄️ 效果不好... ${myPartner.name} 攻擊`);
            else this.showMsg(`💥 ${myPartner.name} 攻擊！`);
            
            enemyHP -= finalDmg;
            GameUI.showDamage('enemy-card', finalDmg, multiplier);
        } else {
            multiplier = getDamageMultiplier(currentEnemy.type, myPartner.type);
            let finalDmg = Math.floor(baseDamage * multiplier);

            if (multiplier > 1) this.showMsg(`⚠️ 糟糕！敵方 ${currentEnemy.name} 強力一擊！`);
            else this.showMsg(`💥 敵方 ${currentEnemy.name} 攻擊！`);

            playerHP -= finalDmg;
            GameUI.showDamage('player-card', finalDmg, multiplier);
        }

        SoundSystem.play('attack_hit');
        this.updateBars();

        setTimeout(() => {
            if (enemyHP <= 0 || playerHP <= 0) {
                this.end();
            } else {
                // 重置 ATB，準備下一輪連打
                if (attacker === 'player') playerATB = 0; else enemyATB = 0;
                isPaused = false;
                this.showMsg("瘋狂按 A D 鍵加速！！");
                this.loop();
            }
        }, 1200);
    },

    updateBars() {
        GameUI.updateDisplay(coins, playerHP, enemyHP, playerATB, enemyATB, myPartner, currentEnemy);
    },

    end() {
        currentScreen = 'capture_prep';
        this.showMsg("戰鬥結束！準備捕捉...");
        setTimeout(() => {
            document.getElementById('fighting-page').classList.add('hidden');
            CaptureSystem.init(currentEnemy);
        }, 1500);
    }
};
