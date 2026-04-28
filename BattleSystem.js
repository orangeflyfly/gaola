// BattleSystem.js - V8.0 大師架構重組版 (戰鬥運算中樞)

const BattleSystem = {
    comboCount: 0,
    comboTimer: null,

    // 1. 戰前準備階段
    initPrep(enemyData) {
        currentScreen = 'prep'; 
        
        // 如果沒有傳入敵方，則從資料庫隨機抽取
        if (!enemyData) {
            enemyData = machineInventory[Math.floor(Math.random() * machineInventory.length)];
        }
        
        currentEnemy = {
            ...enemyData,
            image: `${GAME_CONFIG.ASSET_PATH}${enemyData.id}.png`
        };

        // 渲染準備頁面 (使用 App 定義的 myBackpack)
        const targetBackpack = (typeof myBackpack !== 'undefined') ? myBackpack : [];
        if(typeof GameUI !== 'undefined') {
            GameUI.renderPrepPage(currentEnemy, targetBackpack);
            // 🌟 [V8.0 優化] 統一由 GameUI 管理頁面顯示
            GameUI.switchPage('prep-page');
        }
    },

    // 2. 正式開打 (由準備頁面按鈕觸發)
    launch() {
        if (!myPartner) return; 

        currentScreen = 'fight';
        isPaused = false;
        
        // 重置戰鬥數值
        playerHP = GAME_CONFIG.PLAYER_MAX_HP; 
        enemyHP = GAME_CONFIG.ENEMY_MAX_HP; 
        playerATB = 0; 
        enemyATB = 0;
        
        myPartner.image = `${GAME_CONFIG.ASSET_PATH}${myPartner.id}.png`;

        // 進入戰鬥畫面
        if(typeof GameUI !== 'undefined') GameUI.switchPage('fighting-page');

        // UI 初始化
        const setElSrc = (id, src) => { if(document.getElementById(id)) document.getElementById(id).src = src; };
        const setElText = (id, text) => { if(document.getElementById(id)) document.getElementById(id).innerText = text; };

        setElText('player-name', myPartner.name);
        setElSrc('player-icon', myPartner.image);
        setElSrc('player-racer-img', myPartner.image);
        setElText('enemy-name', currentEnemy.name);
        setElSrc('enemy-icon', currentEnemy.image);
        setElSrc('enemy-racer-img', currentEnemy.image);

        this.comboCount = 0;
        if(this.comboTimer) clearTimeout(this.comboTimer);
        if(typeof GameUI !== 'undefined') GameUI.updateCombo(0);

        // 🌟 [V8.0 優化] 鍵盤連打引擎 (讀取 Config 數值)
        window.onkeydown = (e) => {
            if (currentScreen === 'fight' && !isPaused) {
                const key = e.key.toLowerCase();
                if (key === 'a' || key === 'd') {
                    if(typeof GameUI !== 'undefined') GameUI.shakeImpact('player-card');
                    
                    this.comboCount++;
                    if(typeof GameUI !== 'undefined') GameUI.updateCombo(this.comboCount);

                    if (this.comboTimer) clearTimeout(this.comboTimer);
                    this.comboTimer = setTimeout(() => {
                        this.comboCount = 0;
                        if(typeof GameUI !== 'undefined') GameUI.updateCombo(0);
                    }, 1500);

                    // 讀取設定好的推力
                    let atbGain = GAME_CONFIG.BATTLE.PLAYER_ACTIVE_GAIN || 1.8;
                    if (this.comboCount >= GAME_CONFIG.BATTLE.COMBO_FEVER_THRESHOLD) {
                        atbGain *= 1.2; 
                    }
                    playerATB += atbGain; 
                    
                    if (document.getElementById('action-msg')?.innerText.includes("加速")) {
                        this.showMsg("⚡ 爆發連打！！ ⚡");
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

    // 🌟 [V8.0 優化] 核心循環 (完全數值化)
    loop() {
        if (currentScreen !== 'fight' || isPaused) return;

        // 讀取設定檔跑速
        playerATB += (GAME_CONFIG.BATTLE.PLAYER_PASSIVE_ATB || 0.005);
        enemyATB += (GAME_CONFIG.BATTLE.ENEMY_BASE_SPEED || 0.05) + 
                    (currentEnemy.rarity * (GAME_CONFIG.BATTLE.ENEMY_RARITY_WEIGHT || 0.02));

        if (playerATB > 100) playerATB = 100;
        if (enemyATB > 100) enemyATB = 100;

        // 呼叫 UI 更新位置
        this.updateBars();

        if (playerATB >= 100) {
            this.executeAttack('player');
        } else if (enemyATB >= 100) {
            this.executeAttack('enemy');
        }

        requestAnimationFrame(() => this.loop());
    },

    executeAttack(attacker) {
        isPaused = true;
        let attackerObj = (attacker === 'player') ? myPartner : currentEnemy;
        
        // 演出大招
        if(typeof GameUI !== 'undefined') GameUI.showSkillCutIn(attackerObj);

        setTimeout(() => {
            let baseDamage = (attacker === 'player') ? 20 : 15;
            let multiplier = 1.0;
            let isMiss = false;

            let dodgeChance = (attacker === 'player') ? (currentEnemy.rarity * 2) : 5; 
            if (Math.random() * 100 < dodgeChance) isMiss = true;

            if (attacker === 'player') {
                multiplier = typeof getDamageMultiplier === 'function' ? 
                             getDamageMultiplier(myPartner.type, currentEnemy.type) : 1.0;
                let finalDmg = isMiss ? 0 : Math.floor(baseDamage * multiplier);
                
                this.showMsg(isMiss ? `💨 敵方閃開了！` : `💥 ${myPartner.skill}！！`);
                enemyHP -= finalDmg;
                if(typeof GameUI !== 'undefined') GameUI.showDamage('enemy-card', finalDmg, multiplier, myPartner.type);
            } else {
                multiplier = typeof getDamageMultiplier === 'function' ? 
                             getDamageMultiplier(currentEnemy.type, myPartner.type) : 1.0;
                let finalDmg = isMiss ? 0 : Math.floor(baseDamage * multiplier);

                this.showMsg(isMiss ? `💨 漂亮閃過！` : `💥 敵方的 ${currentEnemy.skill}！`);
                playerHP -= finalDmg;
                if(typeof GameUI !== 'undefined') GameUI.showDamage('player-card', finalDmg, multiplier, currentEnemy.type);
            }

            if (!isMiss && typeof SoundSystem !== 'undefined') SoundSystem.play('attack_hit');
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
            }, 1000);

        }, GAME_CONFIG.BATTLE.SKILL_CUTIN_DURATION || 1000);
    },

    updateBars() {
        if(typeof GameUI !== 'undefined') {
            GameUI.updateDisplay(coins, playerHP, enemyHP, playerATB, enemyATB, myPartner, currentEnemy);
        }
    },

    end() {
        this.comboCount = 0;
        if(this.comboTimer) clearTimeout(this.comboTimer);
        if(typeof GameUI !== 'undefined') {
            GameUI.updateCombo(0);
            this.showMsg("戰鬥結束！準備捕捉...");
            
            setTimeout(() => {
                // 切換至捕獲準備 (由 CaptureSystem 接手)
                if(typeof CaptureSystem !== 'undefined') CaptureSystem.init(currentEnemy);
            }, 1500);
        }
    }
};
