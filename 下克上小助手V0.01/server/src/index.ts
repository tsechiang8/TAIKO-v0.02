import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import authRoutes from './routes/auth';
import factionRoutes from './routes/faction';
import recruitmentRoutes from './routes/recruitment';
import legionRoutes from './routes/legion';
import investmentRoutes from './routes/investment';
import adminRoutes from './routes/admin';
import gameProgressRoutes from './routes/game-progress';
import importRoutes from './routes/import';
import errorReportRoutes from './routes/error-report';
import disbandSoldiersRoutes from './routes/disband-soldiers';
import equipmentPurchaseRoutes from './routes/equipment-purchase';
import taxRateRoutes from './routes/tax-rate';

const app = express();
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';

// CORS配置 - 生产环境更严格
app.use(cors({
  origin: isProduction ? false : true, // 生产环境禁用CORS（同源）
  credentials: true,
}));
app.use(express.json({ limit: '10mb' })); // 支持较大的数据导入
app.use(cookieParser());

// 生产环境：提供静态文件服务
if (isProduction) {
  const clientDistPath = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientDistPath));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '下克上小助手服务运行中' });
});

// Auth routes
app.use('/api/auth', authRoutes);

// Faction routes
app.use('/api/factions', factionRoutes);

// Recruitment routes
app.use('/api/recruitment', recruitmentRoutes);

// Legion routes
app.use('/api/legions', legionRoutes);

// Investment routes
app.use('/api/investment', investmentRoutes);

// Admin routes (Requirements: 8.1-8.5)
app.use('/api/admin', adminRoutes);

// Game progress routes (Requirements: 9.1-9.7)
app.use('/api/game', gameProgressRoutes);

// Import routes (Requirements: 10.1-10.4)
app.use('/api/import', importRoutes);

// Error report routes (Requirements: 14.1-14.9)
app.use('/api/error-reports', errorReportRoutes);

// Disband soldiers routes
app.use('/api/disband-soldiers', disbandSoldiersRoutes);

// Equipment purchase routes
app.use('/api/equipment', equipmentPurchaseRoutes);

// Tax rate routes
app.use('/api/tax-rate', taxRateRoutes);

// 生产环境：SPA路由回退 - 所有非API请求返回index.html
if (isProduction) {
  const clientDistPath = path.join(__dirname, '../../client/dist');
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// 全局错误处理中间件
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
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

export default app;
