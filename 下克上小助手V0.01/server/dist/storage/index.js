"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.readJsonFile = readJsonFile;
exports.writeJsonFile = writeJsonFile;
exports.getFactions = getFactions;
exports.saveFactions = saveFactions;
exports.getFactionById = getFactionById;
exports.getFactionByCode = getFactionByCode;
exports.getTerritories = getTerritories;
exports.saveTerritories = saveTerritories;
exports.getSamurais = getSamurais;
exports.saveSamurais = saveSamurais;
exports.getLegions = getLegions;
exports.saveLegions = saveLegions;
exports.getSpecialProducts = getSpecialProducts;
exports.saveSpecialProducts = saveSpecialProducts;
exports.getGameState = getGameState;
exports.saveGameState = saveGameState;
exports.getOperationRecords = getOperationRecords;
exports.saveOperationRecords = saveOperationRecords;
exports.addOperationRecord = addOperationRecord;
exports.getErrorReports = getErrorReports;
exports.saveErrorReports = saveErrorReports;
exports.addErrorReport = addErrorReport;
exports.createSnapshot = createSnapshot;
exports.getSnapshot = getSnapshot;
exports.restoreFromSnapshot = restoreFromSnapshot;
exports.listSnapshots = listSnapshots;
exports.cleanupOldSnapshots = cleanupOldSnapshots;
exports.getAllData = getAllData;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const uuid_1 = require("uuid");
// 数据目录路径
const DATA_DIR = path.join(__dirname, '../../data');
const SNAPSHOTS_DIR = path.join(DATA_DIR, 'snapshots');
// 确保数据目录存在
function ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(SNAPSHOTS_DIR)) {
        fs.mkdirSync(SNAPSHOTS_DIR, { recursive: true });
    }
}
// 数据文件路径
const getFilePath = (filename) => path.join(DATA_DIR, filename);
const getSnapshotPath = (snapshotId) => path.join(SNAPSHOTS_DIR, `${snapshotId}.json`);
// 通用读取函数
function readJsonFile(filename, defaultValue) {
    ensureDataDir();
    const filePath = getFilePath(filename);
    if (!fs.existsSync(filePath)) {
        return defaultValue;
    }
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(content);
    }
    catch (error) {
        console.error(`读取文件 ${filename} 失败:`, error);
        return defaultValue;
    }
}
// 通用写入函数
function writeJsonFile(filename, data) {
    ensureDataDir();
    const filePath = getFilePath(filename);
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    }
    catch (error) {
        console.error(`写入文件 ${filename} 失败:`, error);
        throw error;
    }
}
// 势力数据操作
function getFactions() {
    return readJsonFile('factions.json', []);
}
function saveFactions(factions) {
    writeJsonFile('factions.json', factions);
}
function getFactionById(id) {
    return getFactions().find(f => f.id === id);
}
function getFactionByCode(code) {
    return getFactions().find(f => f.code === code);
}
// 领地数据操作
function getTerritories() {
    return readJsonFile('territories.json', []);
}
function saveTerritories(territories) {
    writeJsonFile('territories.json', territories);
}
// 武士数据操作
function getSamurais() {
    return readJsonFile('samurais.json', []);
}
function saveSamurais(samurais) {
    writeJsonFile('samurais.json', samurais);
}
// 军团数据操作
function getLegions() {
    return readJsonFile('legions.json', []);
}
function saveLegions(legions) {
    writeJsonFile('legions.json', legions);
}
// 特产数据操作
function getSpecialProducts() {
    return readJsonFile('special-products.json', []);
}
function saveSpecialProducts(products) {
    writeJsonFile('special-products.json', products);
}
// 游戏状态操作
function getGameState() {
    return readJsonFile('game-state.json', {
        currentYear: 1,
        isLocked: false,
        adminCode: 'admin',
    });
}
function saveGameState(state) {
    writeJsonFile('game-state.json', state);
}
// 操作记录
const MAX_OPERATION_RECORDS = 100;
function getOperationRecords() {
    return readJsonFile('operation-records.json', []);
}
function saveOperationRecords(records) {
    writeJsonFile('operation-records.json', records);
}
function addOperationRecord(record) {
    const records = getOperationRecords();
    const newRecord = {
        ...record,
        id: (0, uuid_1.v4)(),
        timestamp: new Date().toISOString(),
    };
    records.unshift(newRecord);
    // 保留最近100条
    if (records.length > MAX_OPERATION_RECORDS) {
        records.splice(MAX_OPERATION_RECORDS);
    }
    saveOperationRecords(records);
    return newRecord;
}
// 错误报告
function getErrorReports() {
    return readJsonFile('error-reports.json', []);
}
function saveErrorReports(reports) {
    writeJsonFile('error-reports.json', reports);
}
function addErrorReport(report) {
    const reports = getErrorReports();
    const newReport = {
        ...report,
        id: (0, uuid_1.v4)(),
        timestamp: new Date().toISOString(),
    };
    reports.unshift(newReport);
    saveErrorReports(reports);
    return newReport;
}
// 数据快照功能
function createSnapshot(operationId) {
    ensureDataDir();
    const snapshot = {
        id: (0, uuid_1.v4)(),
        timestamp: new Date().toISOString(),
        operationId,
        data: {
            factions: getFactions(),
            territories: getTerritories(),
            samurais: getSamurais(),
            legions: getLegions(),
            specialProducts: getSpecialProducts(),
            gameState: getGameState(),
        },
    };
    const snapshotPath = getSnapshotPath(snapshot.id);
    fs.writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2), 'utf-8');
    return snapshot;
}
function getSnapshot(snapshotId) {
    const snapshotPath = getSnapshotPath(snapshotId);
    if (!fs.existsSync(snapshotPath)) {
        return null;
    }
    try {
        const content = fs.readFileSync(snapshotPath, 'utf-8');
        return JSON.parse(content);
    }
    catch (error) {
        console.error(`读取快照 ${snapshotId} 失败:`, error);
        return null;
    }
}
function restoreFromSnapshot(snapshotId) {
    const snapshot = getSnapshot(snapshotId);
    if (!snapshot) {
        return false;
    }
    try {
        saveFactions(snapshot.data.factions);
        saveTerritories(snapshot.data.territories);
        saveSamurais(snapshot.data.samurais);
        saveLegions(snapshot.data.legions);
        saveSpecialProducts(snapshot.data.specialProducts);
        saveGameState(snapshot.data.gameState);
        return true;
    }
    catch (error) {
        console.error(`恢复快照 ${snapshotId} 失败:`, error);
        return false;
    }
}
// 获取所有快照列表（用于回溯功能）
function listSnapshots() {
    ensureDataDir();
    if (!fs.existsSync(SNAPSHOTS_DIR)) {
        return [];
    }
    const files = fs.readdirSync(SNAPSHOTS_DIR);
    const snapshots = [];
    for (const file of files) {
        if (file.endsWith('.json')) {
            try {
                const content = fs.readFileSync(path.join(SNAPSHOTS_DIR, file), 'utf-8');
                const snapshot = JSON.parse(content);
                snapshots.push({
                    id: snapshot.id,
                    timestamp: snapshot.timestamp,
                    operationId: snapshot.operationId,
                });
            }
            catch {
                // 忽略无效文件
            }
        }
    }
    return snapshots.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}
// 清理旧快照（保留最近N个）
function cleanupOldSnapshots(keepCount = 20) {
    const snapshots = listSnapshots();
    if (snapshots.length <= keepCount) {
        return;
    }
    const toDelete = snapshots.slice(keepCount);
    for (const snapshot of toDelete) {
        const snapshotPath = getSnapshotPath(snapshot.id);
        if (fs.existsSync(snapshotPath)) {
            fs.unlinkSync(snapshotPath);
        }
    }
}
// 获取当前所有数据（用于比较）
function getAllData() {
    return {
        factions: getFactions(),
        territories: getTerritories(),
        samurais: getSamurais(),
        legions: getLegions(),
        specialProducts: getSpecialProducts(),
        gameState: getGameState(),
    };
}
//# sourceMappingURL=index.js.map