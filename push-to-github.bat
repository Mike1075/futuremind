@echo off
echo =========================================
echo  推送测试页面到GitHub
echo =========================================
echo.

cd /d D:\CursorWork\FutureMindInstitute\futuremind-new

echo [1/4] 查看修改的文件...
git status
echo.

echo [2/4] 添加文件到Git...
git add pages/test-summarize.tsx
git add docs/测试页面使用指南.md
git add DEPLOY_TEST_PAGE.md
git add push-to-github.bat
git add supabase/functions/summarize-user-activity/
echo 文件添加完成！
echo.

echo [3/4] 提交代码...
git commit -m "feat: 添加用户总结功能Web测试界面

- 创建完整的测试页面 pages/test-summarize.tsx
- 自动加载有数据的测试用户
- 实时日志显示和AI结果展示
- 支持选择不同维度进行测试
- 自动验证数据库存储
- 使用GPT-5 Mini模型
- 提供详细的部署和使用文档"
echo 提交完成！
echo.

echo [4/4] 推送到GitHub...
git push origin master
echo.

echo =========================================
echo  推送完成！
echo =========================================
echo.
echo Vercel将自动检测到新代码并开始部署
echo 请访问 https://vercel.com/dashboard 查看部署状态
echo.
echo 部署完成后访问: https://your-domain.vercel.app/test-summarize
echo.
pause
