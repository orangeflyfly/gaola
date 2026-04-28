// BattleSystem.js - V7.4 視覺與策略進化版 (全代碼)

const BattleSystem = {
    comboCount: 0,
    comboTimer: null,

    // 🌟 [V7.4 新增] 1. 戰前準備階段
    initPrep(enemyData) {
        currentScreen = 'prep'; // 設定目前狀態為準備中
        const imageBaseUrl = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/";
        
        // 隨機選定對手 (如果沒有傳入資料)
        if (!enemyData) {
            enemyData = machineInventory[Math.floor(Math.random() * machineInventory.length)];
        }
        
        currentEnemy = {
            ...enemyData,
            image: `${imageBaseUrl}${enemyData.id}.png`
        };

        // 呼叫 UI 渲染準備頁面 (傳入敵方資料與我方背包)
        GameUI.renderPrepPage(currentEnemy, backpack);
        
        // 隱藏其他頁面
        document.getElementById('selection-page').classList.add('hidden');
        document.getElementById('fighting-page').classList.add('hidden');
    },

    // 🌟 [V7.4 新增] 2. 正式開打 (從準備頁面的按鈕點擊啟動)
    launch() {
        if (!myPartner) return; // 防呆：沒選夥伴不能開打

        currentScreen = 'fight';
        isPaused = false;
        playerHP = 100; enemyHP = 100; playerATB = 0; enemyATB = 0;
        
        // 圖片與名稱初始化
        const imageBaseUrl = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/";
        myPartner.image = `${imageBaseUrl}${myPartner.id}.png`;

        document.getElementById('prep-page').classList.add('hidden');
        document.getElementById('fighting-page').classList.remove('hidden');

        // UI 數值更新
        document.getElementById('player-name').innerText = myPartner.name;
        document.getElementById('player-icon').src = myPartner.image;
        document.getElementById('player-racer-img').src = myPartner.image;

        document.getElementById('enemy-name').innerText = currentEnemy.name;
        document.getElementById('enemy-icon').src = currentEnemy.image;
        document.getElementById('enemy-racer-img').src = currentEnemy.image;

        // 重置 Combo
        this.comboCount = 0;
        if(this.comboTimer) clearTimeout(this.comboTimer);
        GameUI.updateCombo(0);

        // 鍵盤監聽引擎
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
                    if (this.comboCount >= 30) atbGain *= 1.2; 
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

        // 🌟 [V7.4 終極防線]
        if (playerATB > 100) playerATB = 100;
        if (enemyATB > 100) enemyATB = 100;

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

    // 🌟 [V7.4 升級] 攻擊執行 (加入大招演出與粒子特效)
    executeAttack(attacker) {
        isPaused = true;
        let attackerObj = (attacker === 'player') ? myPartner : currentEnemy;
        let defenderId = (attacker === 'player') ? 'enemy-card' : 'player-card';
        
        // 1. 啟動大招過場演出
        GameUI.showSkillCutIn(attackerObj);

        // 演出約 1 秒後結算傷害
        setTimeout(() => {
            let baseDamage = (attacker === 'player') ? 20 : 15;
            let multiplier = 1.0;
            let isMiss = false;

            let dodgeChance = (attacker === 'player') ? (currentEnemy.rarity * 2) : 5; 
            if (Math.random() * 100 < dodgeChance) isMiss = true;

            if (attacker === 'player') {
                multiplier = getDamageMultiplier(myPartner.type, currentEnemy.type);
                let finalDmg = isMiss ? 0 : Math.floor(baseDamage * multiplier);
                
                if (isMiss) this.showMsg(`💨 敵方 ${currentEnemy.name} 閃開了攻擊！`);
                else if (multiplier > 1) this.showMsg(`🔥 ${myPartner.skill}！效果絕佳！`);
                else if (multiplier < 1) this.showMsg(`❄️ ${myPartner.skill}... 效果不好`);
                else this.showMsg(`💥 ${myPartner.skill}！！`);
                
                enemyHP -= finalDmg;
                // 🌟 傳入屬性參數，觸發正確顏色的粒子
                GameUI.showDamage('enemy-card', finalDmg, multiplier, myPartner.type);
            } else {
                multiplier = getDamageMultiplier(currentEnemy.type, myPartner.type);
                let finalDmg = isMiss ? 0 : Math.floor(baseDamage * multiplier);

                if (isMiss) this.showMsg(`💨 漂亮！ ${myPartner.name} 閃開了攻擊！`);
                else if (multiplier > 1) this.showMsg(`⚠️ 糟糕！敵方 ${currentEnemy.name} 使用了 ${currentEnemy.skill}！`);
                else this.showMsg(`💥 敵方 ${currentEnemy.name} 的 ${currentEnemy.skill}！`);

                playerHP -= finalDmg;
                GameUI.showDamage('player-card', finalDmg, multiplier, currentEnemy.type);
            }

            if (!isMiss) SoundSystem.play('attack_hit');
            this.updateBars();

            // 給予短暫停頓後繼續戰鬥
            setTimeout(() => {
                if (enemyHP <= 0 || playerHP <= 0) {
                    this.end();
                } else {
                    if (attacker === 'player') playerATB = 0; else enemyATB = 0;
                    isPaused = false;
                    this.showMsg("請瘋狂按 A D 鍵加速！！");
                    this.loop();
                }
            }, 1000);

        }, 1000); // 這裡的 1000 必須對齊 GameUI.showSkillCutIn 的演出時間
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
