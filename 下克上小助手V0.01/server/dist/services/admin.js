"use strict";
/**
 * 管理员数据管理服务
 * Requirements: 8.1-8.5
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllTerritories = getAllTerritories;
exports.searchTerritories = searchTerritories;
exports.getTerritoryById = getTerritoryById;
exports.createTerritory = createTerritory;
exports.updateTerritory = updateTerritory;
exports.deleteTerritory = deleteTerritory;
exports.getAllFactionCodes = getAllFactionCodes;
exports.getAllFactionsFull = getAllFactionsFull;
exports.updateFactionCodeAdmin = updateFactionCodeAdmin;
exports.createFaction = createFaction;
exports.updateFactionInfo = updateFactionInfo;
exports.deleteFaction = deleteFaction;
exports.getAllLegionsOverview = getAllLegionsOverview;
exports.adminUpdateLegion = adminUpdateLegion;
exports.adminDeleteLegion = adminDeleteLegion;
exports.getAllSpecialProducts = getAllSpecialProducts;
exports.getSpecialProductByName = getSpecialProductByName;
exports.createSpecialProduct = createSpecialProduct;
exports.updateSpecialProduct = updateSpecialProduct;
exports.deleteSpecialProduct = deleteSpecialProduct;
exports.getFactionOptions = getFactionOptions;
exports.getTerritoryOptions = getTerritoryOptions;
exports.getFactionSamurais = getFactionSamurais;
exports.createSamurai = createSamurai;
exports.updateSamurai = updateSamurai;
exports.deleteSamurai = deleteSamurai;
const uuid_1 = require("uuid");
const storage_1 = require("../storage");
/**
 * 获取所有郡国数据
 */
function getAllTerritories() {
    return (0, storage_1.getTerritories)();
}
/**
 * 搜索筛选郡国数据
 */
function searchTerritories(params) {
    let territories = (0, storage_1.getTerritories)();
    if (params.provinceName) {
        territories = territories.filter(t => t.provinceName.includes(params.provinceName));
    }
    if (params.districtName) {
        territories = territories.filter(t => t.districtName.includes(params.districtName));
    }
    if (params.factionId !== undefined) {
        if (params.factionId === '') {
            // 空字符串表示筛选无主领地
            territories = territories.filter(t => !t.factionId);
        }
        else {
            territories = territories.filter(t => t.factionId === params.factionId);
        }
    }
    if (params.hasSpecialProduct !== undefined) {
        territories = territories.filter(t => {
            const hasProduct = !!(t.specialProduct1 || t.specialProduct2 || t.specialProduct3);
            return params.hasSpecialProduct ? hasProduct : !hasProduct;
        });
    }
    if (params.minKokudaka !== undefined) {
        territories = territories.filter(t => t.baseKokudaka >= params.minKokudaka);
    }
    if (params.maxKokudaka !== undefined) {
        territories = territories.filter(t => t.baseKokudaka <= params.maxKokudaka);
    }
    return territories;
}
/**
 * 获取单个郡国数据
 */
function getTerritoryById(id) {
    return (0, storage_1.getTerritories)().find(t => t.id === id);
}
/**
 * 创建郡国
 */
function createTerritory(data) {
    // 验证必填字段
    if (!data.provinceName || !data.districtName) {
        return { success: false, error: '令制国和郡名为必填项' };
    }
    if (!data.castleName) {
        return { success: false, error: '城池名称为必填项' };
    }
    if (data.baseKokudaka === undefined || data.baseKokudaka < 0) {
        return { success: false, error: '基础石高必须为非负数' };
    }
    if (data.castleLevel !== undefined && (data.castleLevel < 1 || data.castleLevel > 7)) {
        return { success: false, error: '城池等级必须在1-7之间' };
    }
    const territories = (0, storage_1.getTerritories)();
    // 生成ID（使用令制国+郡名的拼音首字母或编号）
    const newTerritory = {
        id: (0, uuid_1.v4)(),
        provinceName: data.provinceName,
        districtName: data.districtName,
        castleName: data.castleName,
        castleLevel: data.castleLevel || 1,
        baseKokudaka: data.baseKokudaka,
        specialProduct1: data.specialProduct1,
        specialProduct2: data.specialProduct2,
        specialProduct3: data.specialProduct3,
        developableProduct: data.developableProduct,
        factionId: data.factionId,
        garrisonLegionId: data.garrisonLegionId,
        description: data.description,
    };
    territories.push(newTerritory);
    (0, storage_1.saveTerritories)(territories);
    // 如果分配了势力，更新势力的领地列表
    if (newTerritory.factionId) {
        const factions = (0, storage_1.getFactions)();
        const faction = factions.find(f => f.id === newTerritory.factionId);
        if (faction && !faction.territoryIds.includes(newTerritory.id)) {
            faction.territoryIds.push(newTerritory.id);
            (0, storage_1.saveFactions)(factions);
        }
    }
    return { success: true, territory: newTerritory };
}
/**
 * 更新郡国数据
 */
function updateTerritory(id, data) {
    const territories = (0, storage_1.getTerritories)();
    const index = territories.findIndex(t => t.id === id);
    if (index === -1) {
        return { success: false, error: '郡国不存在' };
    }
    // 验证数据
    if (data.baseKokudaka !== undefined && data.baseKokudaka < 0) {
        return { success: false, error: '基础石高必须为非负数' };
    }
    if (data.castleLevel !== undefined && (data.castleLevel < 1 || data.castleLevel > 7)) {
        return { success: false, error: '城池等级必须在1-7之间' };
    }
    const oldFactionId = territories[index].factionId;
    const newFactionId = data.factionId;
    // 更新数据
    territories[index] = {
        ...territories[index],
        ...data,
        id, // 确保ID不被修改
    };
    (0, storage_1.saveTerritories)(territories);
    // 处理势力变更
    if (oldFactionId !== newFactionId) {
        const factions = (0, storage_1.getFactions)();
        // 从旧势力移除
        if (oldFactionId) {
            const oldFaction = factions.find(f => f.id === oldFactionId);
            if (oldFaction) {
                oldFaction.territoryIds = oldFaction.territoryIds.filter(tid => tid !== id);
            }
        }
        // 添加到新势力
        if (newFactionId) {
            const newFaction = factions.find(f => f.id === newFactionId);
            if (newFaction && !newFaction.territoryIds.includes(id)) {
                newFaction.territoryIds.push(id);
            }
        }
        (0, storage_1.saveFactions)(factions);
    }
    return { success: true, territory: territories[index] };
}
/**
 * 删除郡国
 */
function deleteTerritory(id) {
    const territories = (0, storage_1.getTerritories)();
    const index = territories.findIndex(t => t.id === id);
    if (index === -1) {
        return { success: false, error: '郡国不存在' };
    }
    const territory = territories[index];
    // 检查是否有军团驻扎
    if (territory.garrisonLegionId) {
        return { success: false, error: '该郡国有军团驻扎，请先移除军团' };
    }
    // 从势力的领地列表中移除
    if (territory.factionId) {
        const factions = (0, storage_1.getFactions)();
        const faction = factions.find(f => f.id === territory.factionId);
        if (faction) {
            faction.territoryIds = faction.territoryIds.filter(tid => tid !== id);
            (0, storage_1.saveFactions)(factions);
        }
    }
    territories.splice(index, 1);
    (0, storage_1.saveTerritories)(territories);
    return { success: true };
}
/**
 * 获取所有势力代码信息
 */
function getAllFactionCodes() {
    const factions = (0, storage_1.getFactions)();
    return factions.map(f => ({
        id: f.id,
        name: f.name,
        lordName: f.lordName,
        code: f.code,
    }));
}
/**
 * 获取所有势力完整信息
 */
function getAllFactionsFull() {
    const factions = (0, storage_1.getFactions)();
    const allSamurais = (0, storage_1.getSamurais)();
    const allTerritories = (0, storage_1.getTerritories)();
    const allLegions = (0, storage_1.getLegions)();
    return factions.map(f => {
        const samurais = allSamurais.filter(s => s.factionId === f.id);
        const territories = allTerritories.filter(t => t.factionId === f.id);
        const legions = allLegions.filter(l => l.factionId === f.id);
        // 计算表面石高
        const territoryKokudaka = territories.reduce((sum, t) => sum + t.baseKokudaka, 0);
        const surfaceKokudaka = territoryKokudaka + f.industryKokudaka;
        // 计算总兵力
        const legionSoldiers = legions.reduce((sum, l) => sum + l.soldierCount, 0);
        const totalSoldiers = f.idleSoldiers + legionSoldiers;
        return {
            id: f.id,
            name: f.name,
            lordName: f.lordName,
            code: f.code,
            taxRate: f.taxRate,
            treasury: f.treasury,
            idleSoldiers: f.idleSoldiers,
            rifles: f.rifles,
            horses: f.horses,
            cannons: f.cannons,
            agriculturePoints: f.agriculturePoints,
            commercePoints: f.commercePoints,
            navyPoints: f.navyPoints,
            armamentPoints: f.armamentPoints,
            industryKokudaka: f.industryKokudaka,
            samuraiCount: samurais.length,
            surfaceKokudaka,
            totalSoldiers,
            buffs: f.buffs || [],
        };
    });
}
/**
 * 更新势力代码
 */
function updateFactionCodeAdmin(factionId, newCode) {
    if (!newCode || newCode.trim() === '') {
        return { success: false, error: '代码不能为空' };
    }
    const trimmedCode = newCode.trim();
    const factions = (0, storage_1.getFactions)();
    // 检查代码是否已被使用
    const existingFaction = factions.find(f => f.code === trimmedCode && f.id !== factionId);
    if (existingFaction) {
        return { success: false, error: '该代码已被其他势力使用' };
    }
    // 查找并更新势力
    const factionIndex = factions.findIndex(f => f.id === factionId);
    if (factionIndex === -1) {
        return { success: false, error: '势力不存在' };
    }
    factions[factionIndex].code = trimmedCode;
    (0, storage_1.saveFactions)(factions);
    return { success: true };
}
/**
 * 创建新势力
 */
function createFaction(data) {
    if (!data.name || !data.lordName || !data.code) {
        return { success: false, error: '势力名称、家主姓名和代码为必填项' };
    }
    const factions = (0, storage_1.getFactions)();
    // 检查代码是否已被使用
    if (factions.find(f => f.code === data.code)) {
        return { success: false, error: '该代码已被使用' };
    }
    // 检查名称是否已被使用
    if (factions.find(f => f.name === data.name)) {
        return { success: false, error: '该势力名称已被使用' };
    }
    const newFaction = {
        id: (0, uuid_1.v4)(),
        name: data.name,
        lordName: data.lordName,
        code: data.code,
        taxRate: data.taxRate || 0.6,
        treasury: 0,
        idleSoldiers: 0,
        rifles: 0,
        horses: 0,
        cannons: 0,
        agriculturePoints: 1,
        commercePoints: 1,
        navyPoints: 1,
        armamentPoints: 1,
        industryKokudaka: 0,
        territoryIds: [],
        samuraiIds: [],
        legionIds: [],
        diplomacy: [],
        buffs: [],
    };
    factions.push(newFaction);
    (0, storage_1.saveFactions)(factions);
    return { success: true, faction: newFaction };
}
/**
 * 更新势力基础信息
 */
function updateFactionInfo(factionId, data) {
    const factions = (0, storage_1.getFactions)();
    const index = factions.findIndex(f => f.id === factionId);
    if (index === -1) {
        return { success: false, error: '势力不存在' };
    }
    // 检查名称是否已被其他势力使用
    if (data.name && factions.find(f => f.name === data.name && f.id !== factionId)) {
        return { success: false, error: '该势力名称已被使用' };
    }
    // 验证税率
    if (data.taxRate !== undefined && ![0.4, 0.6, 0.8].includes(data.taxRate)) {
        return { success: false, error: '税率必须为0.4、0.6或0.8' };
    }
    factions[index] = {
        ...factions[index],
        ...data,
        id: factionId, // 确保ID不被修改
        code: factions[index].code, // 代码通过专门的接口修改
    };
    (0, storage_1.saveFactions)(factions);
    return { success: true, faction: factions[index] };
}
/**
 * 删除势力
 */
function deleteFaction(factionId) {
    const factions = (0, storage_1.getFactions)();
    const index = factions.findIndex(f => f.id === factionId);
    if (index === -1) {
        return { success: false, error: '势力不存在' };
    }
    const faction = factions[index];
    // 检查是否有军团
    if (faction.legionIds.length > 0) {
        return { success: false, error: '该势力还有军团，请先解散所有军团' };
    }
    // 释放所有领地
    const territories = (0, storage_1.getTerritories)();
    for (const territory of territories) {
        if (territory.factionId === factionId) {
            territory.factionId = undefined;
        }
    }
    (0, storage_1.saveTerritories)(territories);
    // 移除所有武士
    const samurais = (0, storage_1.getSamurais)();
    const remainingSamurais = samurais.filter(s => s.factionId !== factionId);
    (0, storage_1.saveSamurais)(remainingSamurais);
    // 删除势力
    factions.splice(index, 1);
    (0, storage_1.saveFactions)(factions);
    return { success: true };
}
/**
 * 获取所有军团一览
 */
function getAllLegionsOverview() {
    const legions = (0, storage_1.getLegions)();
    const factions = (0, storage_1.getFactions)();
    const territories = (0, storage_1.getTerritories)();
    return legions.map(legion => {
        const faction = factions.find(f => f.id === legion.factionId);
        const territory = territories.find(t => t.id === legion.locationId);
        return {
            id: legion.id,
            name: legion.name,
            factionId: legion.factionId,
            factionName: faction?.name || '未知势力',
            commanderId: legion.commanderId,
            commanderName: legion.commanderName,
            soldierCount: legion.soldierCount,
            rifles: legion.rifles,
            horses: legion.horses,
            cannons: legion.cannons,
            locationId: legion.locationId,
            locationName: territory?.districtName || legion.locationName || '未知位置',
        };
    });
}
/**
 * 管理员编辑军团
 */
function adminUpdateLegion(legionId, data) {
    const legions = (0, storage_1.getLegions)();
    const index = legions.findIndex(l => l.id === legionId);
    if (index === -1) {
        return { success: false, error: '军团不存在' };
    }
    const legion = legions[index];
    // 验证军团名称
    if (data.name !== undefined) {
        const nameRegex = /^[\u4e00-\u9fa5]{1,8}$/;
        if (!nameRegex.test(data.name)) {
            return { success: false, error: '军团名称必须为1-8个简体中文字符' };
        }
    }
    // 验证将领
    if (data.commanderId !== undefined && data.commanderId !== legion.commanderId) {
        const samurais = (0, storage_1.getSamurais)();
        const newCommander = samurais.find(s => s.id === data.commanderId);
        if (!newCommander) {
            return { success: false, error: '将领不存在' };
        }
        // 检查将领是否已在其他军团
        const conflictLegion = legions.find(l => l.commanderId === data.commanderId && l.id !== legionId);
        if (conflictLegion) {
            return { success: false, error: `该将领已是「${conflictLegion.name}」的指挥官` };
        }
        // 更新旧将领状态
        const oldCommander = samurais.find(s => s.id === legion.commanderId);
        if (oldCommander) {
            oldCommander.currentLegionId = undefined;
            oldCommander.isIdle = true;
        }
        // 更新新将领状态
        newCommander.currentLegionId = legionId;
        newCommander.isIdle = false;
        (0, storage_1.saveSamurais)(samurais);
        // 更新军团的将领名称
        legion.commanderName = newCommander.name;
    }
    // 验证位置
    if (data.locationId !== undefined && data.locationId !== legion.locationId) {
        const territories = (0, storage_1.getTerritories)();
        const newLocation = territories.find(t => t.id === data.locationId);
        if (!newLocation) {
            return { success: false, error: '位置不存在' };
        }
        // 更新旧位置的驻军
        const oldLocation = territories.find(t => t.id === legion.locationId);
        if (oldLocation && oldLocation.garrisonLegionId === legionId) {
            oldLocation.garrisonLegionId = undefined;
        }
        // 更新新位置的驻军
        newLocation.garrisonLegionId = legionId;
        (0, storage_1.saveTerritories)(territories);
        // 更新军团的位置名称
        legion.locationName = newLocation.districtName;
    }
    // 更新军团数据
    legions[index] = {
        ...legion,
        name: data.name ?? legion.name,
        commanderId: data.commanderId ?? legion.commanderId,
        soldierCount: data.soldierCount ?? legion.soldierCount,
        rifles: data.rifles ?? legion.rifles,
        horses: data.horses ?? legion.horses,
        cannons: data.cannons ?? legion.cannons,
        locationId: data.locationId ?? legion.locationId,
    };
    (0, storage_1.saveLegions)(legions);
    return { success: true, legion: legions[index] };
}
/**
 * 管理员删除军团
 */
function adminDeleteLegion(legionId) {
    const legions = (0, storage_1.getLegions)();
    const index = legions.findIndex(l => l.id === legionId);
    if (index === -1) {
        return { success: false, error: '军团不存在' };
    }
    const legion = legions[index];
    // 更新将领状态
    const samurais = (0, storage_1.getSamurais)();
    const commander = samurais.find(s => s.id === legion.commanderId);
    if (commander) {
        commander.currentLegionId = undefined;
        commander.isIdle = true;
        (0, storage_1.saveSamurais)(samurais);
    }
    // 更新位置驻军
    const territories = (0, storage_1.getTerritories)();
    const location = territories.find(t => t.id === legion.locationId);
    if (location && location.garrisonLegionId === legionId) {
        location.garrisonLegionId = undefined;
        (0, storage_1.saveTerritories)(territories);
    }
    // 从势力的军团列表中移除
    const factions = (0, storage_1.getFactions)();
    const faction = factions.find(f => f.id === legion.factionId);
    if (faction) {
        faction.legionIds = faction.legionIds.filter(lid => lid !== legionId);
        // 返还资源到势力库存
        faction.idleSoldiers += legion.soldierCount;
        faction.rifles += legion.rifles;
        faction.horses += legion.horses;
        faction.cannons += legion.cannons;
        (0, storage_1.saveFactions)(factions);
    }
    // 删除军团
    legions.splice(index, 1);
    (0, storage_1.saveLegions)(legions);
    return { success: true };
}
// ============ 特产系统配置 (Requirements: 8.4) ============
/**
 * 获取所有特产
 */
function getAllSpecialProducts() {
    return (0, storage_1.getSpecialProducts)();
}
/**
 * 获取单个特产
 */
function getSpecialProductByName(name) {
    return (0, storage_1.getSpecialProducts)().find(p => p.name === name);
}
/**
 * 创建特产
 */
function createSpecialProduct(data) {
    if (!data.name || data.name.trim() === '') {
        return { success: false, error: '特产名称不能为空' };
    }
    const products = (0, storage_1.getSpecialProducts)();
    // 检查名称是否已存在
    if (products.find(p => p.name === data.name)) {
        return { success: false, error: '该特产名称已存在' };
    }
    const newProduct = {
        name: data.name.trim(),
        annualKokudaka: data.annualKokudaka || 0,
        annualHorses: data.annualHorses || 0,
        soldierCapacityBonus: data.soldierCapacityBonus || 0,
        kokudakaBonus: data.kokudakaBonus || 0,
        otherEffects: data.otherEffects || '',
    };
    products.push(newProduct);
    (0, storage_1.saveSpecialProducts)(products);
    return { success: true, product: newProduct };
}
/**
 * 更新特产
 */
function updateSpecialProduct(name, data) {
    const products = (0, storage_1.getSpecialProducts)();
    const index = products.findIndex(p => p.name === name);
    if (index === -1) {
        return { success: false, error: '特产不存在' };
    }
    // 如果要修改名称，检查新名称是否已存在
    if (data.name && data.name !== name) {
        if (products.find(p => p.name === data.name)) {
            return { success: false, error: '该特产名称已存在' };
        }
        // 更新所有使用该特产的领地
        const territories = (0, storage_1.getTerritories)();
        let updated = false;
        for (const territory of territories) {
            if (territory.specialProduct1 === name) {
                territory.specialProduct1 = data.name;
                updated = true;
            }
            if (territory.specialProduct2 === name) {
                territory.specialProduct2 = data.name;
                updated = true;
            }
            if (territory.specialProduct3 === name) {
                territory.specialProduct3 = data.name;
                updated = true;
            }
            if (territory.developableProduct === name) {
                territory.developableProduct = data.name;
                updated = true;
            }
        }
        if (updated) {
            (0, storage_1.saveTerritories)(territories);
        }
    }
    products[index] = {
        ...products[index],
        ...data,
    };
    (0, storage_1.saveSpecialProducts)(products);
    return { success: true, product: products[index] };
}
/**
 * 删除特产
 */
function deleteSpecialProduct(name) {
    const products = (0, storage_1.getSpecialProducts)();
    const index = products.findIndex(p => p.name === name);
    if (index === -1) {
        return { success: false, error: '特产不存在' };
    }
    // 检查是否有领地使用该特产
    const territories = (0, storage_1.getTerritories)();
    const usingTerritories = territories.filter(t => t.specialProduct1 === name ||
        t.specialProduct2 === name ||
        t.specialProduct3 === name ||
        t.developableProduct === name);
    if (usingTerritories.length > 0) {
        return {
            success: false,
            error: `有 ${usingTerritories.length} 个郡国正在使用该特产，请先移除`
        };
    }
    products.splice(index, 1);
    (0, storage_1.saveSpecialProducts)(products);
    return { success: true };
}
// ============ 辅助函数 ============
/**
 * 获取势力简要信息列表（用于下拉选择）
 */
function getFactionOptions() {
    const factions = (0, storage_1.getFactions)();
    return factions.map(f => ({ id: f.id, name: f.name }));
}
/**
 * 获取领地简要信息列表（用于下拉选择）
 */
function getTerritoryOptions() {
    const territories = (0, storage_1.getTerritories)();
    return territories.map(t => ({
        id: t.id,
        name: t.districtName,
        provinceName: t.provinceName,
    }));
}
/**
 * 获取势力的所有武士
 */
function getFactionSamurais(factionId) {
    const samurais = (0, storage_1.getSamurais)();
    return samurais.filter(s => s.factionId === factionId);
}
/**
 * 创建武士
 */
function createSamurai(data) {
    if (!data.name || data.name.trim() === '') {
        return { success: false, error: '武士姓名不能为空' };
    }
    if (!data.factionId) {
        return { success: false, error: '必须指定所属势力' };
    }
    // 验证势力存在
    const factions = (0, storage_1.getFactions)();
    const faction = factions.find(f => f.id === data.factionId);
    if (!faction) {
        return { success: false, error: '势力不存在' };
    }
    const samurais = (0, storage_1.getSamurais)();
    const newSamurai = {
        id: (0, uuid_1.v4)(),
        name: data.name.trim(),
        age: data.age,
        type: data.type || 'warrior',
        martialValue: data.martialValue || 1,
        civilValue: data.civilValue || 1,
        factionId: data.factionId,
        isIdle: true,
        actionPoints: 2,
    };
    samurais.push(newSamurai);
    (0, storage_1.saveSamurais)(samurais);
    // 更新势力的武士列表
    faction.samuraiIds.push(newSamurai.id);
    (0, storage_1.saveFactions)(factions);
    return { success: true, samurai: newSamurai };
}
/**
 * 更新武士
 */
function updateSamurai(samuraiId, data) {
    const samurais = (0, storage_1.getSamurais)();
    const index = samurais.findIndex(s => s.id === samuraiId);
    if (index === -1) {
        return { success: false, error: '武士不存在' };
    }
    const samurai = samurais[index];
    const oldFactionId = samurai.factionId;
    const newFactionId = data.factionId;
    // 如果要转移势力
    if (newFactionId && newFactionId !== oldFactionId) {
        const factions = (0, storage_1.getFactions)();
        // 验证新势力存在
        const newFaction = factions.find(f => f.id === newFactionId);
        if (!newFaction) {
            return { success: false, error: '目标势力不存在' };
        }
        // 检查武士是否在军团中
        if (samurai.currentLegionId) {
            return { success: false, error: '武士正在军团中，无法转移势力' };
        }
        // 从旧势力移除
        const oldFaction = factions.find(f => f.id === oldFactionId);
        if (oldFaction) {
            oldFaction.samuraiIds = oldFaction.samuraiIds.filter(id => id !== samuraiId);
        }
        // 添加到新势力
        if (!newFaction.samuraiIds.includes(samuraiId)) {
            newFaction.samuraiIds.push(samuraiId);
        }
        (0, storage_1.saveFactions)(factions);
    }
    // 更新武士数据
    samurais[index] = {
        ...samurai,
        name: data.name ?? samurai.name,
        age: data.age ?? samurai.age,
        type: data.type ?? samurai.type,
        martialValue: data.martialValue ?? samurai.martialValue,
        civilValue: data.civilValue ?? samurai.civilValue,
        factionId: newFactionId ?? samurai.factionId,
    };
    (0, storage_1.saveSamurais)(samurais);
    return { success: true, samurai: samurais[index] };
}
/**
 * 删除武士
 */
function deleteSamurai(samuraiId) {
    const samurais = (0, storage_1.getSamurais)();
    const index = samurais.findIndex(s => s.id === samuraiId);
    if (index === -1) {
        return { success: false, error: '武士不存在' };
    }
    const samurai = samurais[index];
    // 检查武士是否在军团中
    if (samurai.currentLegionId) {
        return { success: false, error: '武士正在军团中，请先解散军团或更换将领' };
    }
    // 从势力的武士列表中移除
    const factions = (0, storage_1.getFactions)();
    const faction = factions.find(f => f.id === samurai.factionId);
    if (faction) {
        faction.samuraiIds = faction.samuraiIds.filter(id => id !== samuraiId);
        (0, storage_1.saveFactions)(factions);
    }
    // 删除武士
    samurais.splice(index, 1);
    (0, storage_1.saveSamurais)(samurais);
    return { success: true };
}
//# sourceMappingURL=admin.js.map