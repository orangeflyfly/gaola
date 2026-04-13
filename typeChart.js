// typeChart.js - V7.0 屬性相剋公式書
const TypeChart = {
    // 攻擊方: { 被攻擊方: 倍率 }
    "火": { "草": 2.0, "水": 0.5, "電": 1.0, "一般": 1.0, "火": 1.0 },
    "水": { "火": 2.0, "草": 0.5, "電": 1.0, "一般": 1.0, "水": 1.0 },
    "草": { "水": 2.0, "火": 0.5, "電": 1.0, "一般": 1.0, "草": 1.0 },
    "電": { "水": 2.0, "草": 1.0, "火": 1.0, "一般": 1.0, "電": 1.0 },
    "一般": { "火": 1.0, "水": 1.0, "草": 1.0, "電": 1.0, "一般": 1.0 }
};

/**
 * 取得傷害倍率函數
 * @param {string} attackerType 攻擊者的屬性
 * @param {string} defenderType 防禦者的屬性
 * @returns {number} 倍率 (如 2.0, 0.5, 1.0)
 */
function getDamageMultiplier(attackerType, defenderType) {
    if (!TypeChart[attackerType]) return 1.0;
    return TypeChart[attackerType][defenderType] || 1.0;
}
