// BattleSystem.js - V6.2.7 影像修復與公告強化版 (不簡化)

const BattleSystem = {
    // 1. 戰鬥啟動：強制影像校正
    start(enemyData) {
        currentScreen = 'fight';
        const imageBaseUrl = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/";
        
        // 如果沒傳入敵方(例如加賽)，則隨機抽一個
        if (!enemyData) {
            enemyData = machineInventory[Math.floor(Math.random() * machineInventory.length)];
        }
        
        // [關鍵修復] 強制校正所有路徑，確保不破圖
        currentEnemy = {
            ...enemyData,
            image: `${imageBaseUrl}${enemyData.id}.png`
        };
        myPartner.image = `${imageBaseUrl}${myPartner.id}.png`;

        // 初始化數值
        playerHP = 100; enemyHP = 100; playerATB = 0; enemyATB = 0;
        isPaused = false;

        // 顯示戰鬥頁面並隱藏大廳
        document.getElementById('selection-page').classList.add('hidden');
        document.getElementById('fighting-page').classList.remove('hidden');

        // 更新 UI 圖片與文字
        document.getElementById('player-name').innerText = myPartner.name;
        document.getElementById('player-icon').src = myPartner.image;
        document.getElementById('player-racer-img').src = myPartner.image;

        document.getElementById('enemy-name').innerText = currentEnemy.name;
        document.getElementById('enemy-icon').src = currentEnemy.image;
        document.getElementById('enemy-racer-img').src = currentEnemy.image;

        this.updateBars();
        this.loop();
        
        // 發出戰鬥開始公告
        this.showMsg("⚡ 戰鬥開始！ ⚡");
    },

    // 2. 戰鬥公告控制：對接 CSS 特效
    showMsg(text) {
        const msgEl = document.getElementById('action-msg');
        if (msgEl) {
            msgEl.innerText = text;
            // 每次顯示新文字都重新觸發一次縮放動畫
            msgEl.style.animation = 'none';
            msgEl.offsetHeight; // 強制重繪
            msgEl.style.animation = 'actionPulse 0.4s ease-in-out infinite alternate';
        }
    },

    // 3. 傷害噴字特效：對接 CSS 巨大噴字
    showDamage(targetId, amount) {
        const targetEl = document.getElementById(targetId);
        if (!targetEl) return;

        const popup = document.createElement('div');
        popup.className = 'damage-popup';
        popup.innerText = `-${amount}`;
        
        // 隨機偏移一點點位置，增加打擊動感
        const rect = targetEl.getBoundingClientRect();
        popup.style.left = `${rect.left + rect.width / 2 + (Math.random() * 40 - 20)}px`;
        popup.style.top = `${rect.top + (Math.random() * 20 - 10)}px`;

        document.body.appendChild(popup);
        setTimeout(() => popup.remove(), 700);
    },

    // 4. 核心邏輯：跑條與攻擊觸發
    loop() {
        if (currentScreen !== 'fight' || isPaused) return;

        // 進度條自然增加
        playerATB += 0.4;
        enemyATB += (0.3 + (currentEnemy.rarity * 0.05));

        // 更新賽道頭像位置
        document.getElementById('player-racer').style.left = `${playerATB}%`;
        document.getElementById('enemy-racer').style.left = `${enemyATB}%`;

        // 判定誰先到達終點
        if (playerATB >= 95) {
            this.executeAttack('player');
        } else if (enemyATB >= 95) {
            this.executeAttack('enemy');
        }

        requestAnimationFrame(() => this.loop());
    },

    executeAttack(attacker) {
        isPaused = true;
        if (attacker === 'player') {
            this.showMsg(`🔥 ${myPartner.name} 攻擊！`);
            enemyHP -= 20;
            this.showDamage('enemy-card', 20);
            SoundSystem.play('attack_hit');
        } else {
            this.showMsg(`💥 敵方 ${currentEnemy.name} 攻擊！`);
            playerHP -= 15;
            this.showDamage('player-card', 15);
            SoundSystem.play('attack_hit');
        }

        this.updateBars();

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

    updateBars() {
        document.getElementById('player-hp-text').innerText = `${playerHP}/100`;
        document.getElementById('player-hp-bar-real').style.width = `${playerHP}%`;
        document.getElementById('enemy-hp-text').innerText = `${enemyHP}/100`;
        document.getElementById('enemy-hp-bar').style.width = `${enemyHP}%`;
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
