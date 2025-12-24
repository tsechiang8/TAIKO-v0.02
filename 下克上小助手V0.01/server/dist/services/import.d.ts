/**
 * 数据导入服务
 * Requirements: 10.1-10.4
 *
 * 支持从纯文本（Excel粘贴格式）导入郡国、军团、势力数据
 */
export type ImportType = 'territory' | 'legion' | 'faction' | 'specialProduct';
export interface ImportResult {
    success: boolean;
    imported: number;
    errors: string[];
    warnings: string[];
}
export interface ParseResult<T> {
    success: boolean;
    data: T[];
    errors: string[];
    warnings: string[];
}
/**
 * 郡国导入格式（Excel粘贴）：
 * 令制国 | 郡名 | 城池名称 | 城池等级 | 基础石高 | 特产1 | 特产2 | 特产3 | 可发展特产 | 势力名称 | 描述
 */
export interface TerritoryImportRow {
    provinceName: string;
    districtName: string;
    castleName: string;
    castleLevel: number;
    baseKokudaka: number;
    specialProduct1?: string;
    specialProduct2?: string;
    specialProduct3?: string;
    developableProduct?: string;
    factionName?: string;
    description?: string;
}
/**
 * 解析郡国数据
 */
export declare function parseTerritoryData(text: string): ParseResult<TerritoryImportRow>;
/**
 * 导入郡国数据
 */
export declare function importTerritoryData(text: string, overwrite?: boolean): ImportResult;
/**
 * 军团导入格式（Excel粘贴）：
 * 势力名称 | 军团名称 | 将领姓名 | 士兵数量 | 铁炮 | 战马 | 大筒 | 驻扎位置（郡名）
 */
export interface LegionImportRow {
    factionName: string;
    name: string;
    commanderName: string;
    soldierCount: number;
    rifles: number;
    horses: number;
    cannons: number;
    locationName: string;
}
/**
 * 解析军团数据
 */
export declare function parseLegionData(text: string): ParseResult<LegionImportRow>;
/**
 * 导入军团数据
 */
export declare function importLegionData(text: string, overwrite?: boolean): ImportResult;
/**
 * 势力导入格式（Excel粘贴）：
 * 势力名称 | 家主姓名 | 登录代码 | 税率 | 金库 | 闲置士兵 | 铁炮 | 战马 | 大筒 | 农业点数 | 商业点数 | 水军点数 | 武备点数 | 产业石高
 */
export interface FactionImportRow {
    name: string;
    lordName: string;
    code: string;
    taxRate: number;
    treasury: number;
    idleSoldiers: number;
    rifles: number;
    horses: number;
    cannons: number;
    agriculturePoints: number;
    commercePoints: number;
    navyPoints: number;
    armamentPoints: number;
    industryKokudaka: number;
}
/**
 * 解析势力数据
 */
export declare function parseFactionData(text: string): ParseResult<FactionImportRow>;
/**
 * 导入势力数据
 */
export declare function importFactionData(text: string, overwrite?: boolean): ImportResult;
/**
 * 根据类型导入数据
 */
export declare function importData(type: ImportType, text: string, overwrite?: boolean): ImportResult;
/**
 * 获取导入模板（表头）
 */
export declare function getImportTemplate(type: ImportType): string;
/**
 * 特产导入格式（Excel粘贴）：
 * 特产名称 | 年产石高 | 年产战马 | 兵力加成 | 石高加成（百分比） | 其他效果
 */
export interface SpecialProductImportRow {
    name: string;
    annualKokudaka: number;
    annualHorses: number;
    soldierCapacityBonus: number;
    kokudakaBonus: number;
    otherEffects: string;
}
/**
 * 解析特产数据
 */
export declare function parseSpecialProductData(text: string): ParseResult<SpecialProductImportRow>;
/**
 * 导入特产数据
 */
export declare function importSpecialProductData(text: string, overwrite?: boolean): ImportResult;
//# sourceMappingURL=import.d.ts.map