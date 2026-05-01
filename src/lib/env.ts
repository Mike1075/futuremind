// 环境变量验证和配置
export function validateEnvVars() {
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ] as const;

  const missingVars: string[] = [];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missingVars.push(envVar);
    }
  }

  if (missingVars.length > 0) {
    const errorMessage = `❌ 缺少必需的环境变量: ${missingVars.join(', ')}\n\n` +
      '请确保在部署平台设置以下环境变量:\n' +
      '- NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co\n' +
      '- NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key\n\n' +
      '参考 .env.example 文件获取完整配置示例。';

    throw new Error(errorMessage);
  }

  // 验证 URL 格式
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  try {
    new URL(supabaseUrl);
  } catch {
    throw new Error(`❌ NEXT_PUBLIC_SUPABASE_URL 格式无效: ${supabaseUrl}`);
  }

  return {
    supabaseUrl,
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    nextAuthUrl: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    nextAuthSecret: process.env.NEXTAUTH_SECRET
  };
}

// 延迟验证环境变量，避免构建时错误
export function getEnv() {
  return validateEnvVars();
}