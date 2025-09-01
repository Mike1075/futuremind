#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 设置测试环境...\n');

// 检查环境变量文件
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('❌ 未找到 .env.local 文件');
  console.log('请确保已创建 .env.local 文件并配置了Supabase连接信息');
  process.exit(1);
}

console.log('✅ 环境变量文件检查通过');

// 安装依赖
console.log('📦 检查依赖...');
try {
  execSync('npm list @supabase/supabase-js', { stdio: 'ignore' });
  console.log('✅ Supabase依赖已安装');
} catch (error) {
  console.log('📦 安装Supabase依赖...');
  execSync('npm install @supabase/supabase-js', { stdio: 'inherit' });
}

// 启动开发服务器
console.log('🔧 启动开发服务器...');
try {
  execSync('npm run dev &', { stdio: 'inherit' });
  console.log('✅ 开发服务器已启动');
} catch (error) {
  console.log('⚠️  请手动启动开发服务器: npm run dev');
}

// 等待服务器启动
console.log('⏳ 等待服务器启动...');
setTimeout(() => {
  // 初始化数据库
  console.log('🗄️  初始化测试数据库...');
  try {
    execSync('curl -X POST http://localhost:3000/api/init-database', { stdio: 'inherit' });
    console.log('✅ 数据库初始化完成');
  } catch (error) {
    console.log('⚠️  请手动访问: http://localhost:3000/api/init-database');
  }

  console.log('\n🎉 测试环境设置完成！');
  console.log('\n📋 可用的测试链接:');
  console.log('• 主应用: http://localhost:3000');
  console.log('• 测试仪表板: http://localhost:3000/test-dashboard');
  console.log('• 数据库状态: http://localhost:3000/api/init-database');
  console.log('\n📖 查看完整测试指南: ./TESTING_GUIDE.md');
}, 5000);