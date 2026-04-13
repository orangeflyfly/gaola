// CaptureSystem.js - V7.2 20等分精準轉盤 (防呆綁定修復版)

const CaptureSystem = {
    // 20 等分球種分佈 (M:大師x2, U:高級x5, G:超級x6, P:精靈x7)
    segments: [
        'M', 'P', 'G', 'U', 'P',
        'G', 'P', 'U', 'G', 'P',
        'M', 'P', 'G', 'U', 'P',
        'G', 'U', 'P', 'G', 'U'
    ],
    colors: { 'M': '#9c27b0', 'U': '#ffeb3b', 'G': '#2196f3', 'P': '#f44336' },
    names: { 'M': '大師球', 'U': '高級球', 'G': '超級球', 'P': '精靈球' },
    rates: { 'M': 100, 'U': 2.5, 'G': 1.5, 'P': 1.0 },
    balls: { 'M': '🟣', 'U': '🟡', 'G': '🔵', 'P': '🔴' },

    currentDeg: 0,
    isSpinning: false,
    spinInterval: null,
    targetEnemy: null,

    init(enemy) {
        this.targetEnemy = enemy;
        this.currentDeg = 0;

        // 解除轉盤頁面的隱藏狀態
        document.getElementById('roulette-page').classList.remove('hidden');
        
        // 重置 UI 狀態
        document.getElementById('roulette-result').classList.add('hidden');
        document.getElementById('pay-confirm-box').classList.add('hidden');
        document.getElementById('fail-exit-btn').classList.add('hidden');
        document.getElementById('roulette-title').innerText = `準備捕獲：${enemy.name}`;

        // [關鍵修復 1] 強制綁定按鈕事件，無視 HTML 的 onclick 屬性
        const stopBtn = document.getElementById('stop-btn');
        stopBtn.style.display = 'inline-block';
        stopBtn.onclick = () => this.stop();

        this.renderWheel();
        this.startSpin();
    },

    // 動態生成 20 等分轉盤
    renderWheel() {
        const wheel = document.getElementById('wheel');
        let gradient = [];
        for (let i = 0; i < 20; i++) {
            let color = this.colors[this.segments[i]];
            // 每一格佔 18 度 (360 / 20 = 18)
            gradient.push(`${color} ${i * 18}deg ${(i + 1) * 18}deg`);
        }
        wheel.style.background = `conic-gradient(${gradient.join(', ')})`;
        wheel.style.borderRadius = '50%';
        wheel.style.width = '350px';
        wheel.style.height = '350px';
        wheel.style.border = '8px solid #fff';
        wheel.style.boxShadow = '0 0 30px rgba(255, 235, 59, 0.4)';
        // [關鍵修復 2] 移除 margin，交給 CSS 的 wheel-container 控制
        wheel.style.transition = 'transform 0s'; 
    },

    startSpin() {
        this.isSpinning = true;
        this.spinInterval = setInterval(() => {
            this.currentDeg += 18; // 每次跳動一格的距離，產生街機的機械感
            document.getElementById('wheel').style.transform = `rotate(${this.currentDeg}deg)`;
        }, 40);
    },

    // 拍擊停止與物理判定
    stop() {
        if (!this.isSpinning) return;
        this.isSpinning = false;
        clearInterval(this.spinInterval);
        document.getElementById('stop-btn').style.display = 'none';

        // 物理角度精準換算
        let normalized = this.currentDeg % 360;
        let hitAngle = (360 - normalized) % 360; // 0度在正上方
        let hitIndex = Math.floor(hitAngle / 18);
        let hitBall = this.segments[hitIndex];

        this.processResult(hitBall);
    },

    processResult(ballCode) {
        const resultBox = document.getElementById('roulette-result');
        const msgEl = document.getElementById('result-msg');
        const ballEmoji = document.getElementById('result-ball');

        resultBox.classList.remove('hidden');
        ballEmoji.innerText = this.balls[ballCode];
        msgEl.innerText = `丟出了 ${this.names[ballCode]}！ 判定中...`;
        msgEl.style.color = "#fff";

        GameUI.shake('result-ball');
        SoundSystem.play('attack_hit'); 

        setTimeout(() => {
            let success = false;
            // 捕獲機率公式
            if (ballCode === 'M') {
                success = true; // 大師球必中
            } else {
                let baseRate = (7 - this.targetEnemy.rarity) * 15; // 基礎機率
                let finalRate = baseRate * this.rates[ballCode];
                success = (Math.random() * 100) < finalRate;
            }

            if (success) {
                msgEl.innerText = `✨ 成功捕獲 ${this.targetEnemy.name}！ ✨`;
                msgEl.style.color = "#4caf50";
                document.getElementById('pay-ask-text').innerText = `是否投入 10 金幣將實體卡匣印出？`;
                document.getElementById('pay-confirm-box').classList.remove('hidden');

                // ==========================================
                // 🛠️ [Bug 修復] 綁定「確認支付入包」按鈕邏輯
                // ==========================================
                document.getElementById('confirm-pay-btn').onclick = () => {
                    // 1. 檢查金幣是否足夠 (假設全域變數為 coins)
                    if (coins >= 10) {
                        coins -= 10; 
                        
                        // 2. 加入背包 (確保 myBackpack 陣列存在)
                        if (typeof myBackpack === 'undefined') window.myBackpack = [];
                        
                        // [V7.2 屬性防呆] 確保抓到的怪有屬性標籤
                        if (!this.targetEnemy.type) this.targetEnemy.type = "一般";
                        myBackpack.push(this.targetEnemy);
                        
                        // 3. 觸發存檔 (配合 storage.js 的寫法，這裡加上基礎的 localStorage 雙重保障)
                        try {
                            localStorage.setItem('gaole_coins', coins);
                            localStorage.setItem('gaole_backpack', JSON.stringify(myBackpack));
                            // 如果您 storage.js 裡有 saveGame()，也可以在這裡呼叫：
                            if (typeof saveGame === 'function') saveGame();
                        } catch(e) { console.warn("存檔失敗", e); }
                        
                        // 4. 更新畫面右上角的金幣顯示
                        const coinEl = document.getElementById('coin-count');
                        if (coinEl) coinEl.innerText = coins;

                        // 5. 華麗的印卡提示與退場
                        document.getElementById('pay-confirm-box').classList.add('hidden');
                        msgEl.innerText = `🖨️ 卡匣印製中... 喀喀喀...`;
                        msgEl.style.color = "#ffeb3b";
                        
                        setTimeout(() => {
                            alert(`🎉 實體卡匣【${this.targetEnemy.name}】掉落！已存入背包。`);
                            // 呼叫 game.js 裡的結束函數，回到大廳
                            if (typeof finishCapture === 'function') finishCapture(); 
                        }, 800);

                    } else {
                        // 金幣不夠的防呆警告
                        alert("❌ 投幣餘額不足 10 枚！機台無法印出卡匣！");
                    }
                };

            } else {
                msgEl.innerText = `💨 哎呀！ ${this.targetEnemy.name} 掙脫逃跑了...`;
                msgEl.style.color = "#f44336";
                document.getElementById('fail-exit-btn').classList.remove('hidden');
            }
        }, 1800);
    }
};
