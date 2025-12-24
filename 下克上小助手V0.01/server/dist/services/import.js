"use strict";
/**
 * 数据导入服务
 * Requirements: 10.1-10.4
 *
 * 支持从纯文本（Excel粘贴格式）导入郡国、军团、势力数据
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseTerritoryData = parseTerritoryData;
exports.importTerritoryData = importTerritoryData;
exports.parseLegionData = parseLegionData;
exports.importLegionData = importLegionData;
exports.parseFactionData = parseFactionData;
exports.importFactionData = importFactionData;
exports.importData = importData;
exports.getImportTemplate = getImportTemplate;
exports.parseSpecialProductData = parseSpecialProductData;
exports.importSpecialProductData = importSpecialProductData;
const uuid_1 = require("uuid");
const storage_1 = require("../storage");
/**
 * 解析制表符分隔的文本行
 */
function parseTabSeparatedLine(line) {
    return line.split('\t').map(cell => cell.trim());
}
/**
 * 解析文本为行数组（跳过空行）
 */
function parseLines(text) {
    return text
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => line.length > 0);
}
/**
 * 解析郡国数据
 */
function parseTerritoryData(text) {
    const lines = parseLines(text);
    const data = [];
    const errors = [];
    const warnings = [];
    if (lines.length === 0) {
        return { success: false, data: [], errors: ['没有数据可导入'], warnings: [] };
    }
    // 跳过表头（如果第一行看起来像表头）
    let startIndex = 0;
    const firstLine = lines[0].toLowerCase();
    if (firstLine.includes('令制国') || firstLine.includes('郡名') || firstLine.includes('province')) {
        startIndex = 1;
    }
    for (let i = startIndex; i < lines.length; i++) {
        const lineNum = i + 1;
        const cells = parseTabSeparatedLine(lines[i]);
        if (cells.length < 5) {
            errors.push(`第${lineNum}行: 列数不足，至少需要5列（令制国、郡名、城池名称、城池等级、基础石高）`);
            continue;
        }
        const [provinceName, districtName, castleName, castleLevelStr, baseKokudakaStr] = cells;
        // 验证必填字段
        if (!provinceName) {
            errors.push(`第${lineNum}行: 令制国不能为空`);
            continue;
        }
        if (!districtName) {
            errors.push(`第${lineNum}行: 郡名不能为空`);
            continue;
        }
        if (!castleName) {
            errors.push(`第${lineNum}行: 城池名称不能为空`);
            continue;
        }
        // 解析城池等级
        const castleLevel = parseInt(castleLevelStr, 10);
        if (isNaN(castleLevel) || castleLevel < 1 || castleLevel > 7) {
            errors.push(`第${lineNum}行: 城池等级必须为1-7的整数`);
            continue;
        }
        // 解析基础石高
        const baseKokudaka = parseFloat(baseKokudakaStr);
        if (isNaN(baseKokudaka) || baseKokudaka < 0) {
            errors.push(`第${lineNum}行: 基础石高必须为非负数`);
            continue;
        }
        const row = {
            provinceName,
            districtName,
            castleName,
            castleLevel,
            baseKokudaka,
            specialProduct1: cells[5] || undefined,
            specialProduct2: cells[6] || undefined,
            specialProduct3: cells[7] || undefined,
            developableProduct: cells[8] || undefined,
            factionName: cells[9] || undefined,
            description: cells[10] || undefined,
        };
        data.push(row);
    }
    return {
        success: errors.length === 0,
        data,
        errors,
        warnings,
    };
}
/**
 * 导入郡国数据
 */
function importTerritoryData(text, overwrite = true) {
    const parseResult = parseTerritoryData(text);
    if (!parseResult.success && parseResult.data.length === 0) {
        return {
            success: false,
            imported: 0,
            errors: parseResult.errors,
            warnings: parseResult.warnings,
        };
    }
    const factions = (0, storage_1.getFactions)();
    const factionMap = new Map(factions.map(f => [f.name, f]));
    const existingTerritories = (0, storage_1.getTerritories)();
    const existingMap = new Map(existingTerritories.map(t => [`${t.provinceName}-${t.districtName}`, t]));
    const newTerritories = overwrite ? [] : [...existingTerritories];
    const warnings = [...parseResult.warnings];
    let imported = 0;
    for (const row of parseResult.data) {
        const key = `${row.provinceName}-${row.districtName}`;
        const existing = existingMap.get(key);
        // 查找势力ID
        let factionId;
        if (row.factionName) {
            const faction = factionMap.get(row.factionName);
            if (faction) {
                factionId = faction.id;
            }
            else {
                warnings.push(`郡国「${row.districtName}」的势力「${row.factionName}」不存在，已忽略势力分配`);
            }
        }
        const territory = {
            id: existing?.id || (0, uuid_1.v4)(),
            provinceName: row.provinceName,
            districtName: row.districtName,
            castleName: row.castleName,
            castleLevel: row.castleLevel,
            baseKokudaka: row.baseKokudaka,
            specialProduct1: row.specialProduct1,
            specialProduct2: row.specialProduct2,
            specialProduct3: row.specialProduct3,
            developableProduct: row.developableProduct,
            factionId,
            garrisonLegionId: existing?.garrisonLegionId,
            description: row.description,
        };
        if (overwrite) {
            newTerritories.push(territory);
        }
        else {
            const idx = newTerritories.findIndex(t => t.id === territory.id);
            if (idx >= 0) {
                newTerritories[idx] = territory;
            }
            else {
                newTerritories.push(territory);
            }
        }
        imported++;
    }
    (0, storage_1.saveTerritories)(newTerritories);
    // 更新势力的领地列表
    for (const faction of factions) {
        faction.territoryIds = newTerritories
            .filter(t => t.factionId === faction.id)
            .map(t => t.id);
    }
    (0, storage_1.saveFactions)(factions);
    return {
        success: parseResult.errors.length === 0,
        imported,
        errors: parseResult.errors,
        warnings,
    };
}
/**
 * 解析军团数据
 */
function parseLegionData(text) {
    const lines = parseLines(text);
    const data = [];
    const errors = [];
    const warnings = [];
    if (lines.length === 0) {
        return { success: false, data: [], errors: ['没有数据可导入'], warnings: [] };
    }
    // 跳过表头
    let startIndex = 0;
    const firstLine = lines[0].toLowerCase();
    if (firstLine.includes('势力') || firstLine.includes('军团') || firstLine.includes('faction')) {
        startIndex = 1;
    }
    for (let i = startIndex; i < lines.length; i++) {
        const lineNum = i + 1;
        const cells = parseTabSeparatedLine(lines[i]);
        if (cells.length < 8) {
            errors.push(`第${lineNum}行: 列数不足，需要8列（势力名称、军团名称、将领姓名、士兵数量、铁炮、战马、大筒、驻扎位置）`);
            continue;
        }
        const [factionName, name, commanderName, soldierCountStr, riflesStr, horsesStr, cannonsStr, locationName] = cells;
        // 验证必填字段
        if (!factionName) {
            errors.push(`第${lineNum}行: 势力名称不能为空`);
            continue;
        }
        if (!name) {
            errors.push(`第${lineNum}行: 军团名称不能为空`);
            continue;
        }
        if (!commanderName) {
            errors.push(`第${lineNum}行: 将领姓名不能为空`);
            continue;
        }
        // 验证军团名称格式（1-8个简体中文字符）
        const nameRegex = /^[\u4e00-\u9fa5]{1,8}$/;
        if (!nameRegex.test(name)) {
            errors.push(`第${lineNum}行: 军团名称必须为1-8个简体中文字符`);
            continue;
        }
        // 解析数值
        const soldierCount = parseInt(soldierCountStr, 10) || 0;
        const rifles = parseInt(riflesStr, 10) || 0;
        const horses = parseInt(horsesStr, 10) || 0;
        const cannons = parseInt(cannonsStr, 10) || 0;
        if (soldierCount < 0 || rifles < 0 || horses < 0 || cannons < 0) {
            errors.push(`第${lineNum}行: 数值不能为负数`);
            continue;
        }
        if (soldierCount === 0) {
            errors.push(`第${lineNum}行: 士兵数量必须大于0`);
            continue;
        }
        if (!locationName) {
            errors.push(`第${lineNum}行: 驻扎位置不能为空`);
            continue;
        }
        data.push({
            factionName,
            name,
            commanderName,
            soldierCount,
            rifles,
            horses,
            cannons,
            locationName,
        });
    }
    return {
        success: errors.length === 0,
        data,
        errors,
        warnings,
    };
}
/**
 * 导入军团数据
 */
function importLegionData(text, overwrite = true) {
    const parseResult = parseLegionData(text);
    if (!parseResult.success && parseResult.data.length === 0) {
        return {
            success: false,
            imported: 0,
            errors: parseResult.errors,
            warnings: parseResult.warnings,
        };
    }
    const factions = (0, storage_1.getFactions)();
    const factionMap = new Map(factions.map(f => [f.name, f]));
    const territories = (0, storage_1.getTerritories)();
    const territoryMap = new Map(territories.map(t => [t.districtName, t]));
    const samurais = (0, storage_1.getSamurais)();
    const samuraiMap = new Map(samurais.map(s => [s.name, s]));
    const existingLegions = (0, storage_1.getLegions)();
    const existingMap = new Map(existingLegions.map(l => [`${l.factionId}-${l.name}`, l]));
    const newLegions = overwrite ? [] : [...existingLegions];
    const warnings = [...parseResult.warnings];
    const errors = [...parseResult.errors];
    let imported = 0;
    // 跟踪已分配的将领
    const assignedCommanders = new Set();
    for (const row of parseResult.data) {
        // 查找势力
        const faction = factionMap.get(row.factionName);
        if (!faction) {
            errors.push(`军团「${row.name}」的势力「${row.factionName}」不存在`);
            continue;
        }
        // 查找将领
        const commander = samuraiMap.get(row.commanderName);
        if (!commander) {
            errors.push(`军团「${row.name}」的将领「${row.commanderName}」不存在`);
            continue;
        }
        // 检查将领是否属于该势力
        if (commander.factionId !== faction.id) {
            errors.push(`军团「${row.name}」的将领「${row.commanderName}」不属于势力「${row.factionName}」`);
            continue;
        }
        // 检查将领是否已被分配
        if (assignedCommanders.has(commander.id)) {
            errors.push(`将领「${row.commanderName}」已被分配给其他军团`);
            continue;
        }
        // 查找位置
        const location = territoryMap.get(row.locationName);
        if (!location) {
            errors.push(`军团「${row.name}」的驻扎位置「${row.locationName}」不存在`);
            continue;
        }
        const key = `${faction.id}-${row.name}`;
        const existing = existingMap.get(key);
        const legion = {
            id: existing?.id || (0, uuid_1.v4)(),
            name: row.name,
            commanderId: commander.id,
            commanderName: commander.name,
            soldierCount: row.soldierCount,
            rifles: row.rifles,
            horses: row.horses,
            cannons: row.cannons,
            locationId: location.id,
            locationName: location.districtName,
            factionId: faction.id,
        };
        if (overwrite) {
            newLegions.push(legion);
        }
        else {
            const idx = newLegions.findIndex(l => l.id === legion.id);
            if (idx >= 0) {
                newLegions[idx] = legion;
            }
            else {
                newLegions.push(legion);
            }
        }
        assignedCommanders.add(commander.id);
        imported++;
    }
    (0, storage_1.saveLegions)(newLegions);
    // 更新武士状态
    for (const samurai of samurais) {
        const legion = newLegions.find(l => l.commanderId === samurai.id);
        if (legion) {
            samurai.currentLegionId = legion.id;
            samurai.isIdle = false;
        }
        else {
            samurai.currentLegionId = undefined;
            samurai.isIdle = true;
        }
    }
    (0, storage_1.saveSamurais)(samurais);
    // 更新领地驻军
    for (const territory of territories) {
        const legion = newLegions.find(l => l.locationId === territory.id);
        territory.garrisonLegionId = legion?.id;
    }
    (0, storage_1.saveTerritories)(territories);
    // 更新势力的军团列表
    for (const faction of factions) {
        faction.legionIds = newLegions
            .filter(l => l.factionId === faction.id)
            .map(l => l.id);
    }
    (0, storage_1.saveFactions)(factions);
    return {
        success: errors.length === 0,
        imported,
        errors,
        warnings,
    };
}
/**
 * 解析势力数据
 */
function parseFactionData(text) {
    const lines = parseLines(text);
    const data = [];
    const errors = [];
    const warnings = [];
    if (lines.length === 0) {
        return { success: false, data: [], errors: ['没有数据可导入'], warnings: [] };
    }
    // 跳过表头
    let startIndex = 0;
    const firstLine = lines[0].toLowerCase();
    if (firstLine.includes('势力') || firstLine.includes('家主') || firstLine.includes('faction')) {
        startIndex = 1;
    }
    for (let i = startIndex; i < lines.length; i++) {
        const lineNum = i + 1;
        const cells = parseTabSeparatedLine(lines[i]);
        if (cells.length < 3) {
            errors.push(`第${lineNum}行: 列数不足，至少需要3列（势力名称、家主姓名、登录代码）`);
            continue;
        }
        const [name, lordName, code] = cells;
        // 验证必填字段
        if (!name) {
            errors.push(`第${lineNum}行: 势力名称不能为空`);
            continue;
        }
        if (!lordName) {
            errors.push(`第${lineNum}行: 家主姓名不能为空`);
            continue;
        }
        if (!code) {
            errors.push(`第${lineNum}行: 登录代码不能为空`);
            continue;
        }
        // 解析税率
        let taxRate = parseFloat(cells[3]) || 0.6;
        if (![0.4, 0.6, 0.8].includes(taxRate)) {
            // 尝试解析百分比格式
            if (taxRate === 40)
                taxRate = 0.4;
            else if (taxRate === 60)
                taxRate = 0.6;
            else if (taxRate === 80)
                taxRate = 0.8;
            else {
                warnings.push(`第${lineNum}行: 税率「${cells[3]}」无效，已使用默认值0.6`);
                taxRate = 0.6;
            }
        }
        data.push({
            name,
            lordName,
            code,
            taxRate,
            treasury: parseFloat(cells[4]) || 0,
            idleSoldiers: parseInt(cells[5], 10) || 0,
            rifles: parseInt(cells[6], 10) || 0,
            horses: parseInt(cells[7], 10) || 0,
            cannons: parseInt(cells[8], 10) || 0,
            agriculturePoints: parseInt(cells[9], 10) || 1,
            commercePoints: parseInt(cells[10], 10) || 1,
            navyPoints: parseInt(cells[11], 10) || 1,
            armamentPoints: parseInt(cells[12], 10) || 1,
            industryKokudaka: parseFloat(cells[13]) || 0,
        });
    }
    return {
        success: errors.length === 0,
        data,
        errors,
        warnings,
    };
}
/**
 * 导入势力数据
 */
function importFactionData(text, overwrite = true) {
    const parseResult = parseFactionData(text);
    if (!parseResult.success && parseResult.data.length === 0) {
        return {
            success: false,
            imported: 0,
            errors: parseResult.errors,
            warnings: parseResult.warnings,
        };
    }
    const existingFactions = (0, storage_1.getFactions)();
    const existingMap = new Map(existingFactions.map(f => [f.name, f]));
    const codeSet = new Set();
    const newFactions = overwrite ? [] : [...existingFactions];
    const warnings = [...parseResult.warnings];
    const errors = [...parseResult.errors];
    let imported = 0;
    for (const row of parseResult.data) {
        // 检查代码是否重复
        if (codeSet.has(row.code)) {
            errors.push(`势力「${row.name}」的代码「${row.code}」与其他势力重复`);
            continue;
        }
        codeSet.add(row.code);
        const existing = existingMap.get(row.name);
        const faction = {
            id: existing?.id || (0, uuid_1.v4)(),
            name: row.name,
            lordName: row.lordName,
            code: row.code,
            taxRate: row.taxRate,
            treasury: row.treasury,
            idleSoldiers: row.idleSoldiers,
            rifles: row.rifles,
            horses: row.horses,
            cannons: row.cannons,
            agriculturePoints: row.agriculturePoints,
            commercePoints: row.commercePoints,
            navyPoints: row.navyPoints,
            armamentPoints: row.armamentPoints,
            industryKokudaka: row.industryKokudaka,
            territoryIds: existing?.territoryIds || [],
            samuraiIds: existing?.samuraiIds || [],
            legionIds: existing?.legionIds || [],
            diplomacy: existing?.diplomacy || [],
            buffs: existing?.buffs || [],
        };
        if (overwrite) {
            newFactions.push(faction);
        }
        else {
            const idx = newFactions.findIndex(f => f.id === faction.id);
            if (idx >= 0) {
                newFactions[idx] = faction;
            }
            else {
                newFactions.push(faction);
            }
        }
        imported++;
    }
    (0, storage_1.saveFactions)(newFactions);
    return {
        success: errors.length === 0,
        imported,
        errors,
        warnings,
    };
}
// ============ 统一导入接口 ============
/**
 * 根据类型导入数据
 */
function importData(type, text, overwrite = true) {
    switch (type) {
        case 'territory':
            return importTerritoryData(text, overwrite);
        case 'legion':
            return importLegionData(text, overwrite);
        case 'faction':
            return importFactionData(text, overwrite);
        case 'specialProduct':
            return importSpecialProductData(text, overwrite);
        default:
            return {
                success: false,
                imported: 0,
                errors: [`未知的导入类型: ${type}`],
                warnings: [],
            };
    }
}
/**
 * 获取导入模板（表头）
 */
function getImportTemplate(type) {
    switch (type) {
        case 'territory':
            return '令制国\t郡名\t城池名称\t城池等级\t基础石高\t特产1\t特产2\t特产3\t可发展特产\t势力名称\t描述';
        case 'legion':
            return '势力名称\t军团名称\t将领姓名\t士兵数量\t铁炮\t战马\t大筒\t驻扎位置';
        case 'faction':
            return '势力名称\t家主姓名\t登录代码\t税率\t金库\t闲置士兵\t铁炮\t战马\t大筒\t农业点数\t商业点数\t水军点数\t武备点数\t产业石高';
        case 'specialProduct':
            return '特产名称\t年产石高\t年产战马\t兵力加成\t石高加成\t其他效果';
        default:
            return '';
    }
}
/**
 * 解析特产数据
 */
function parseSpecialProductData(text) {
    const lines = parseLines(text);
    const data = [];
    const errors = [];
    const warnings = [];
    if (lines.length === 0) {
        return { success: false, data: [], errors: ['没有数据可导入'], warnings: [] };
    }
    // 跳过表头
    let startIndex = 0;
    const firstLine = lines[0].toLowerCase();
    if (firstLine.includes('特产') || firstLine.includes('名称') || firstLine.includes('石高') || firstLine.includes('product')) {
        startIndex = 1;
    }
    for (let i = startIndex; i < lines.length; i++) {
        const lineNum = i + 1;
        const cells = parseTabSeparatedLine(lines[i]);
        if (cells.length < 1) {
            errors.push(`第${lineNum}行: 列数不足，至少需要1列（特产名称）`);
            continue;
        }
        const [name, annualKokudakaStr, annualHorsesStr, soldierCapacityBonusStr, kokudakaBonusStr, otherEffects] = cells;
        // 验证必填字段
        if (!name) {
            errors.push(`第${lineNum}行: 特产名称不能为空`);
            continue;
        }
        // 解析年产石高
        const annualKokudaka = parseFloat(annualKokudakaStr) || 0;
        // 解析年产战马
        const annualHorses = parseInt(annualHorsesStr, 10) || 0;
        // 解析兵力加成
        const soldierCapacityBonus = parseInt(soldierCapacityBonusStr, 10) || 0;
        // 解析石高加成（支持百分比格式如 "10%" 或 "0.1"）
        let kokudakaBonus = 0;
        if (kokudakaBonusStr) {
            const bonusStr = kokudakaBonusStr.trim();
            if (bonusStr.endsWith('%')) {
                // 百分比格式，如 "10%" -> 0.1
                kokudakaBonus = parseFloat(bonusStr.slice(0, -1)) / 100;
            }
            else {
                // 数值格式，如果大于1则认为是百分比
                const parsed = parseFloat(bonusStr);
                if (!isNaN(parsed)) {
                    kokudakaBonus = Math.abs(parsed) > 1 ? parsed / 100 : parsed;
                }
            }
        }
        data.push({
            name,
            annualKokudaka,
            annualHorses,
            soldierCapacityBonus,
            kokudakaBonus,
            otherEffects: otherEffects || '',
        });
    }
    return {
        success: errors.length === 0,
        data,
        errors,
        warnings,
    };
}
/**
 * 导入特产数据
 */
function importSpecialProductData(text, overwrite = true) {
    const parseResult = parseSpecialProductData(text);
    if (!parseResult.success && parseResult.data.length === 0) {
        return {
            success: false,
            imported: 0,
            errors: parseResult.errors,
            warnings: parseResult.warnings,
        };
    }
    const existingProducts = (0, storage_1.getSpecialProducts)();
    const existingMap = new Map(existingProducts.map(p => [p.name, p]));
    const newProducts = overwrite ? [] : [...existingProducts];
    const warnings = [...parseResult.warnings];
    let imported = 0;
    for (const row of parseResult.data) {
        const existing = existingMap.get(row.name);
        const product = {
            name: row.name,
            annualKokudaka: row.annualKokudaka,
            annualHorses: row.annualHorses,
            soldierCapacityBonus: row.soldierCapacityBonus,
            kokudakaBonus: row.kokudakaBonus,
            otherEffects: row.otherEffects,
        };
        if (overwrite) {
            newProducts.push(product);
        }
        else {
            const idx = newProducts.findIndex(p => p.name === product.name);
            if (idx >= 0) {
                newProducts[idx] = product;
            }
            else {
                newProducts.push(product);
            }
        }
        imported++;
    }
    (0, storage_1.saveSpecialProducts)(newProducts);
    return {
        success: parseResult.errors.length === 0,
        imported,
        errors: parseResult.errors,
        warnings,
    };
}
//# sourceMappingURL=import.js.map