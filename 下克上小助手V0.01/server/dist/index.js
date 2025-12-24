"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const path_1 = __importDefault(require("path"));
const auth_1 = __importDefault(require("./routes/auth"));
const faction_1 = __importDefault(require("./routes/faction"));
const recruitment_1 = __importDefault(require("./routes/recruitment"));
const legion_1 = __importDefault(require("./routes/legion"));
const investment_1 = __importDefault(require("./routes/investment"));
const admin_1 = __importDefault(require("./routes/admin"));
const game_progress_1 = __importDefault(require("./routes/game-progress"));
const import_1 = __importDefault(require("./routes/import"));
const error_report_1 = __importDefault(require("./routes/error-report"));
const disband_soldiers_1 = __importDefault(require("./routes/disband-soldiers"));
const equipment_purchase_1 = __importDefault(require("./routes/equipment-purchase"));
const tax_rate_1 = __importDefault(require("./routes/tax-rate"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';
// CORS配置 - 生产环境更严格
app.use((0, cors_1.default)({
    origin: isProduction ? false : true, // 生产环境禁用CORS（同源）
    credentials: true,
}));
app.use(express_1.default.json({ limit: '10mb' })); // 支持较大的数据导入
app.use((0, cookie_parser_1.default)());
// 生产环境：提供静态文件服务
if (isProduction) {
    const clientDistPath = path_1.default.join(__dirname, '../../client/dist');
    app.use(express_1.default.static(clientDistPath));
}
// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: '下克上小助手服务运行中' });
});
// Auth routes
app.use('/api/auth', auth_1.default);
// Faction routes
app.use('/api/factions', faction_1.default);
// Recruitment routes
app.use('/api/recruitment', recruitment_1.default);
// Legion routes
app.use('/api/legions', legion_1.default);
// Investment routes
app.use('/api/investment', investment_1.default);
// Admin routes (Requirements: 8.1-8.5)
app.use('/api/admin', admin_1.default);
// Game progress routes (Requirements: 9.1-9.7)
app.use('/api/game', game_progress_1.default);
// Import routes (Requirements: 10.1-10.4)
app.use('/api/import', import_1.default);
// Error report routes (Requirements: 14.1-14.9)
app.use('/api/error-reports', error_report_1.default);
// Disband soldiers routes
app.use('/api/disband-soldiers', disband_soldiers_1.default);
// Equipment purchase routes
app.use('/api/equipment', equipment_purchase_1.default);
// Tax rate routes
app.use('/api/tax-rate', tax_rate_1.default);
// 生产环境：SPA路由回退 - 所有非API请求返回index.html
if (isProduction) {
    const clientDistPath = path_1.default.join(__dirname, '../../client/dist');
    app.get('*', (_req, res) => {
        res.sendFile(path_1.default.join(clientDistPath, 'index.html'));
    });
}
// 全局错误处理中间件
app.use((err, _req, res, _next) => {
    console.error('服务器错误:', err);
    res.status(500).json({
        success: false,
        error: '服务器内部错误',
    });
});
app.listen(PORT, () => {
    console.log(`服务器运行在端口 ${PORT}`);
    if (isProduction) {
        console.log('生产模式：提供静态文件服务');
    }
});
exports.default = app;
//# sourceMappingURL=index.js.map