// BattleSystem.js - V8.0.2 視覺大師對接版

const BattleSystem = {
    comboCount: 0,
    comboTimer: null,

    // 1. 戰前準備階段
    initPrep(enemyData) {
        currentScreen = 'prep'; 
        if (!enemyData) {
            enemyData = machineInventory[Math.floor(Math.random() * machineInventory.length)];
        }
        
        currentEnemy = {
            ...enemyData,
            image: `${GAME_CONFIG.ASSET_PATH}${enemyData.id}.png`
        };

        // 🌟 [V8.0 新增] 遇見敵人即錄入圖鑑剪影
        if (typeof GameStorage !== 'undefined') {
            GameStorage.updatePokedex(currentEnemy.id, 'seen');
        }

        const targetBackpack = (typeof myBackpack !== 'undefined') ? myBackpack : [];
        if(typeof GameUI !== 'undefined') {
            GameUI.renderPrepPage(currentEnemy, targetBackpack);
            GameUI.switchPage('prep-page');
        }
    },

    // 2. 正式開打
    launch() {
        if (!myPartner) return; 

        currentScreen = 'fight';
        isPaused = false;
        playerHP = GAME_CONFIG.PLAYER_MAX_HP; 
        enemyHP = GAME_CONFIG.ENEMY_MAX_HP; 
        playerATB = 0; 
        enemyATB = 0;
        
        myPartner.image = `${GAME_CONFIG.ASSET_PATH}${myPartner.id}.png`;

        if(typeof GameUI !== 'undefined') GameUI.switchPage('fighting-page');

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

        // 鍵盤連打引擎
        window.onkeydown = (e) => {
            if (currentScreen === 'fight' && !isPaused) {
                const key = e.key.toLowerCase();
                if (key === 'a' || key === 'd') {
                    if(typeof GameUI !== 'undefined') GameUI.shakeImpact('player-card');
                    
                    this.comboCount++;
                    if(typeof GameUI !== 'undefined') GameUI.updateCombo(this.comboCount);

                    // 🌟 [V8.0.2 新增] 連打噴錢特效：每 5 連擊噴發一次
                    if (typeof EffectSystem !== 'undefined' && this.comboCount % 5 === 0) {
                        EffectSystem.spawnCoinShower('player-card');
                    }

                    if (this.comboTimer) clearTimeout(this.comboTimer);
                    this.comboTimer = setTimeout(() => {
                        this.comboCount = 0;
                        if(typeof GameUI !== 'undefined') {
                            GameUI.updateCombo(0);
                            // 停止 FEVER 模糊
                            if(typeof EffectSystem !== 'undefined') EffectSystem.applyFeverBlur(false);
                        }
                    }, 1500);

                    let atbGain = GAME_CONFIG.BATTLE.PLAYER_ACTIVE_GAIN || 1.8;
                    if (this.comboCount >= GAME_CONFIG.BATTLE.COMBO_FEVER_THRESHOLD) {
                        atbGain *= 1.2; 
                        // 🌟 [V8.0.2 新增] 進入 FEVER 時啟動模糊特效
                        if(typeof EffectSystem !== 'undefined') EffectSystem.applyFeverBlur(true);
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

    loop() {
        if (currentScreen !== 'fight' || isPaused) return;

        playerATB += (GAME_CONFIG.BATTLE.PLAYER_PASSIVE_ATB || 0.005);
        enemyATB += (GAME_CONFIG.BATTLE.ENEMY_BASE_SPEED || 0.05) + 
                    (currentEnemy.rarity * (GAME_CONFIG.BATTLE.ENEMY_RARITY_WEIGHT || 0.02));

        if (playerATB > 100) playerATB = 100;
        if (enemyATB > 100) enemyATB = 100;

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
        
        if(typeof GameUI !== 'undefined') GameUI.showSkillCutIn(attackerObj);

        setTimeout(() => {
            let baseDamage = (attacker === 'player') ? 20 : 15;
            let multiplier = typeof getDamageMultiplier === 'function' ? 
                             getDamageMultiplier(attackerObj.type, (attacker === 'player' ? currentEnemy.type : myPartner.type)) : 1.0;
            let isMiss = Math.random() * 100 < (attacker === 'player' ? currentEnemy.rarity * 2 : 5);

            if (attacker === 'player') {
                let finalDmg = isMiss ? 0 : Math.floor(baseDamage * multiplier);
                this.showMsg(isMiss ? `💨 敵方閃開了！` : `💥 ${myPartner.skill}！！`);
                
                // 🌟 [V8.0.2 新增] 爆擊螢幕震動：效果絕佳時大震動
                if (!isMiss && multiplier > 1 && typeof EffectSystem !== 'undefined') {
                    EffectSystem.shakeScreen(GAME_CONFIG.VISUAL.SCREEN_SHAKE_STRENGTH || 15);
                }

                enemyHP -= finalDmg;
                if(typeof GameUI !== 'undefined') GameUI.showDamage('enemy-card', finalDmg, multiplier, myPartner.type);
            } else {
                let finalDmg = isMiss ? 0 : Math.floor(baseDamage * multiplier);
                this.showMsg(isMiss ? `💨 漂亮閃過！` : `💥 敵方的 ${currentEnemy.skill}！`);
                
                // 🌟 [V8.0.2 新增] 被打也要小震動一下，增加痛感
                if (!isMiss && typeof EffectSystem !== 'undefined') {
                    EffectSystem.shakeScreen(5);
                }

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
            if(typeof EffectSystem !== 'undefined') EffectSystem.applyFeverBlur(false);
            this.showMsg("戰鬥結束！準備捕捉...");
            
            setTimeout(() => {
                if(typeof CaptureSystem !== 'undefined') CaptureSystem.init(currentEnemy);
            }, 1500);
        }
    }
};
