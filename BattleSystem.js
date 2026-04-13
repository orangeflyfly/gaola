// BattleSystem.js - V7.0 屬性相剋核心版 (不簡化原本邏輯)

const BattleSystem = {
    // 1. 戰鬥啟動：對接屬性資料
    start(enemyData) {
        currentScreen = 'fight';
        const imageBaseUrl = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/";
        
        // 如果沒傳入敵方，則隨機抽一個
        if (!enemyData) {
            enemyData = machineInventory[Math.floor(Math.random() * machineInventory.length)];
        }
        
        // [關鍵修復] 確保 currentEnemy 包含屬性(type)
        currentEnemy = {
            ...enemyData,
            image: `${imageBaseUrl}${enemyData.id}.png`
        };
        
        // 確保我方夥伴圖片與資料完整
        myPartner.image = `${imageBaseUrl}${myPartner.id}.png`;

        // 初始化戰鬥數值
        playerHP = 100; enemyHP = 100; playerATB = 0; enemyATB = 0;
        isPaused = false;

        // UI 頁面切換
        document.getElementById('selection-page').classList.add('hidden');
        document.getElementById('fighting-page').classList.remove('hidden');

        // 更新戰鬥卡面與賽道圖標
        document.getElementById('player-name').innerText = myPartner.name;
        document.getElementById('player-icon').src = myPartner.image;
        document.getElementById('player-racer-img').src = myPartner.image;

        document.getElementById('enemy-name').innerText = currentEnemy.name;
        document.getElementById('enemy-icon').src = currentEnemy.image;
        document.getElementById('enemy-racer-img').src = currentEnemy.image;

        this.updateBars();
        this.loop();
        
        this.showMsg("⚡ 戰鬥開始！ ⚡");
    },

    // 2. 戰鬥公告：新增屬性反饋文字
    showMsg(text) {
        const msgEl = document.getElementById('action-msg');
        if (msgEl) {
            msgEl.innerText = text;
            msgEl.style.animation = 'none';
            msgEl.offsetHeight; 
            msgEl.style.animation = 'actionPulse 0.4s ease-in-out infinite alternate';
        }
    },

    // 3. 核心邏輯：跑條系統
    loop() {
        if (currentScreen !== 'fight' || isPaused) return;

        // 進度條自然增加 (我方略快於敵方基礎值)
        playerATB += 0.4;
        enemyATB += (0.3 + (currentEnemy.rarity * 0.05));

        // 更新賽道頭像位置
        document.getElementById('player-racer').style.left = `${playerATB}%`;
        document.getElementById('enemy-racer').style.left = `${enemyATB}%`;

        // 判定進度條滿格
        if (playerATB >= 95) {
            this.executeAttack('player');
        } else if (enemyATB >= 95) {
            this.executeAttack('enemy');
        }

        requestAnimationFrame(() => this.loop());
    },

    // 4. [重點改版] 攻擊執行：計算屬性倍率
    executeAttack(attacker) {
        isPaused = true;
        let baseDamage = (attacker === 'player') ? 20 : 15;
        let multiplier = 1.0;
        let attackerName = "";
        let defenderId = "";

        if (attacker === 'player') {
            // 我方攻擊：計算我方屬性對敵方屬性的倍率
            multiplier = getDamageMultiplier(myPartner.type, currentEnemy.type);
            attackerName = myPartner.name;
            defenderId = 'enemy-card';
            
            // 根據倍率調整公告
            if (multiplier > 1) this.showMsg(`🔥 效果絕佳！ ${attackerName} 攻擊！`);
            else if (multiplier < 1) this.showMsg(`❄️ 效果不好... ${attackerName} 攻擊`);
            else this.showMsg(`💥 ${attackerName} 攻擊！`);
            
            let finalDmg = Math.floor(baseDamage * multiplier);
            enemyHP -= finalDmg;
            
            // 對接 UI 噴字 (傳入倍率觸發黃色暴擊字體)
            GameUI.showDamage(defenderId, finalDmg, multiplier);
        } else {
            // 敵方攻擊：計算敵方屬性對我方屬性的倍率
            multiplier = getDamageMultiplier(currentEnemy.type, myPartner.type);
            attackerName = currentEnemy.name;
            defenderId = 'player-card';

            if (multiplier > 1) this.showMsg(`⚠️ 糟糕！敵方 ${attackerName} 威力巨大！`);
            else this.showMsg(`💥 敵方 ${attackerName} 攻擊！`);

            let finalDmg = Math.floor(baseDamage * multiplier);
            playerHP -= finalDmg;
            
            GameUI.showDamage(defenderId, finalDmg, multiplier);
        }

        SoundSystem.play('attack_hit');
        this.updateBars();

        // 攻擊演出停頓
        setTimeout(() => {
            if (enemyHP <= 0 || playerHP <= 0) {
                this.end();
            } else {
                if (attacker === 'player') playerATB = 0; else enemyATB = 0;
                isPaused = false;
                this.showMsg("瘋狂按 A D 鍵加速！！");
                this.loop();
            }
        }, 1200);
    },

    // 5. 更新血條：新增對接 UI 屬性標籤
    updateBars() {
        // [修正] 呼叫新的 UI 更新函數，帶入 currentEnemy 參數
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
