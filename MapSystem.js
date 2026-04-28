// MapSystem.js - V9.0.8 震撼開獎與 BOSS 警告版 (全代碼不簡化)

const MapSystem = {
    options: [],
    currentIndex: 0,
    grassChoices: [], 
    isAwake: false,   
    canPickGrass: false, 

    // 1. 刷新地圖選項
    async refresh() {
        currentMapOptions = [];
        const imageBaseUrl = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/";
        
        for (let i = 0; i < 5; i++) {
            let p = machineInventory[Math.floor(Math.random() * machineInventory.length)];
            let silhouettes = [];
            for(let j=0; j<4; j++) {
                let s = machineInventory[Math.floor(Math.random() * machineInventory.length)];
                silhouettes.push({ id: s.id, image: `${imageBaseUrl}${s.id}.png` });
            }

            currentMapOptions.push({ 
                ...p, 
                image: `${imageBaseUrl}${p.id}.png`,
                silhouettes: silhouettes
            });
        }
        this.currentIndex = 0;
        this.render(); 
    },

    // 2. 切換選單
    change(dir) {
        if (typeof SoundSystem !== 'undefined') SoundSystem.play('button_click');
        this.currentIndex = (this.currentIndex + dir + 5) % 5;
        this.render();
    },

    // 3. 渲染主畫面
    render() {
        const data = currentMapOptions[this.currentIndex];
        const display = document.getElementById('single-map-display');
        const silhouetteContainer = document.getElementById('map-silhouettes');
        if(!data || !display) return;

        display.innerHTML = `
            <div class="large-map-content ${data.rarity >= 6 ? 'rarity-6' : ''}">
                <img src="${data.image}" class="poke-sprite">
                <div class="card-info">
                    <div style="font-size: 18px; color: #00d4ff; font-weight: bold; margin-bottom: 8px; letter-spacing: 2px;">探索區域 0${this.currentIndex + 1}</div>
                    <b style="font-size: 42px; text-shadow: 0 0 15px rgba(0,212,255,0.5);">${data.name}</b>
                    <div style="margin-top: 15px;">
                        <span style="background: rgba(0,212,255,0.2); padding: 6px 18px; border-radius: 30px; font-size: 18px; color: #fff; border: 1px solid #00d4ff;">
                            危險程度 ★ ${data.rarity}
                        </span>
                    </div>
                </div>
            </div>`;

        if(silhouetteContainer) {
            silhouetteContainer.innerHTML = data.silhouettes.map(s => `
                <img src="${s.image}" class="silhouette-icon">
            `).join('');
        }
    },

    // 4. 確認地圖選擇
    confirmSelection() {
        if (!this.isAwake) {
            if (coins < 30) {
                alert("⚠️ 金幣不足！請先點擊下方『🪙 打工』賺取金幣。");
                return;
            }
            coins -= 30;
            if (typeof SoundSystem !== 'undefined') SoundSystem.play('coin_in');
            const coinEl = document.querySelectorAll('#coin-count');
            coinEl.forEach(el => el.innerText = coins);

            const standby = document.getElementById('standby-screen');
            if(standby) standby.classList.add('hidden');

            const screen = document.getElementById('main-screen');
            if(screen) {
                screen.classList.remove('screen-off');
                screen.classList.add('screen-wake');
            }
            this.isAwake = true;

            const physicalBtn = document.querySelector('.btn-red');
            if(physicalBtn) physicalBtn.innerText = "⭕ 確認地圖 (前往草叢)";
        } else {
            const selectedEnemy = currentMapOptions[this.currentIndex];
            if (typeof SoundSystem !== 'undefined') SoundSystem.play('ui_click');
            this.initGrassEvent(selectedEnemy);
        }
    },

    // 5. 核心：全自動連環開獎流程
    initGrassEvent(mapBoss) {
        currentScreen = 'grass';
        const imageBaseUrl = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/";
        this.grassChoices = [];
        this.grassChoices.push(mapBoss);
        
        for(let i=0; i<2; i++) {
            let p = machineInventory[Math.floor(Math.random() * machineInventory.length)];
            this.grassChoices.push({ ...p, image: `${imageBaseUrl}${p.id}.png` });
        }
        this.grassChoices.sort(() => Math.random() - 0.5);

        if(typeof GameUI !== 'undefined') GameUI.switchPage('grass-event-page');

        // 初始化草叢與提示
        const grassBoxes = document.querySelectorAll('.grass-box');
        const hintEl = document.getElementById('grass-hint');
        if(hintEl) {
            hintEl.style.opacity = "0";
            hintEl.innerText = "📡 正在鎖定棲息地寶可夢...";
        }

        // 🌟 確保初始鎖死點擊
        this.canPickGrass = false;
        
        // Step 1: 系統自動撒網連丟
        grassBoxes.forEach((box, index) => {
            box.style.opacity = "1"; // 確保草叢可見
            box.style.transform = "scale(1)"; // 重置縮放
            box.innerHTML = `<div class="grass-sprite"></div>`;
            setTimeout(() => {
                const ball = document.createElement('div');
                ball.className = 'throw-ball';
                box.appendChild(ball);
                ball.style.animation = 'throwArc 0.6s ease-in-out forwards';
            }, index * 200);
        });

        // Step 2: 🌟 [修復點] 改用明確的對象引用，並延後啟動，確保拋球完成
        setTimeout(() => {
            console.log("啟動自動開獎鏈...");
            MapSystem.autoRevealChain(0);
        }, 1200); 
    },

    // 🌟 連環引爆邏輯：依序爆發，金光加長演出
    autoRevealChain(index) {
        const grassBoxes = document.querySelectorAll('.grass-box');
        
        // 判定是否結束
        if (index >= grassBoxes.length) {
            console.log("自動開獎結束，開放玩家點擊。");
            this.canPickGrass = true;
            const hintEl = document.getElementById('grass-hint');
            if(hintEl) {
                hintEl.innerText = "⭕ 請選擇你要獲得的寶可夢！";
                hintEl.style.opacity = "1";
                hintEl.style.animation = "blink 1s infinite";
            }
            return;
        }

        const box = grassBoxes[index];
        const picked = this.grassChoices[index];
        const isGold = picked.rarity >= 6;

        // 移除球，準備爆發
        const ballImg = box.querySelector('.throw-ball');
        if(ballImg) ballImg.remove();

        // 建立光柱
        const beam = document.createElement('div');
        beam.className = `beam-effect ${isGold ? 'gold-beam' : 'blue-beam'}`;
        box.appendChild(beam);

        // 噴發音效
        if (typeof SoundSystem !== 'undefined') {
            SoundSystem.play(isGold ? 'shiny_spawn' : 'attack_hit');
        }

        // 🌟 使用 config 參數或預設演出時長
        const revealDelay = isGold ? 1500 : 800;

        setTimeout(() => {
            // 移除光柱並顯示寶可夢
            beam.remove();
            box.innerHTML = `<img src="${picked.image}" style="width:100%; animation: pulse 0.5s;">`;
            
            // 遞迴呼叫下一隻，帶一點小間隔增加層次感
            setTimeout(() => {
                MapSystem.autoRevealChain(index + 1);
            }, 300); 
        }, revealDelay);
    },

    // 6. 點擊開獎：獲得保底怪，隨後進入戰鬥遭遇儀式
    selectGrass(index) {
        // 🌟 如果自動開獎還沒跑完，禁止點擊
        if (!this.canPickGrass) return;

        const picked = this.grassChoices[index];
        const grassBoxes = document.querySelectorAll('.grass-box');
        
        this.canPickGrass = false;
        if (typeof SoundSystem !== 'undefined') SoundSystem.play('ui_click');

        // 選中反饋：放大選中者，淡出其餘
        grassBoxes.forEach((box, i) => {
            if(i === index) {
                box.style.transform = "scale(1.2)";
                box.style.zIndex = "100";
            } else {
                box.style.opacity = "0.3";
                box.style.transform = "scale(0.8)";
            }
        });

        // [存檔與圖鑑同步]
        if (typeof myBackpack !== 'undefined') {
            myBackpack.push({...picked});
            if (typeof GameStorage !== 'undefined') {
                GameStorage.saveCurrentState();
                GameStorage.updatePokedex(picked.id, 'caught');
            }
        }

        // [遭遇儀式]
        setTimeout(() => {
            let finalEnemy = (Math.random() < 0.7) ? currentMapOptions[this.currentIndex] : picked;
            const isBoss = (finalEnemy.id === currentMapOptions[this.currentIndex].id);

            if (isBoss) {
                this.triggerBossWarning(finalEnemy);
            } else {
                BattleSystem.initPrep(finalEnemy);
            }
        }, 1200);
    },

    // 🌟 BOSS 警告視窗儀式
    triggerBossWarning(bossData) {
        const warningUI = document.getElementById('boss-warning-overlay');
        if (warningUI) {
            warningUI.classList.remove('hidden');
            if (typeof SoundSystem !== 'undefined') SoundSystem.play('boss_warn'); 
            
            // 點擊警告視窗後正式進入對戰
            warningUI.onclick = () => {
                warningUI.classList.add('hidden');
                BattleSystem.initPrep(bossData);
            };
        } else {
            alert("⚠️ 偵測到強大氣息！BOSS 現身！");
            BattleSystem.initPrep(bossData);
        }
    }
};

function confirmMapSelection() { MapSystem.confirmSelection(); }
function changeMap(dir) { MapSystem.change(dir); }
