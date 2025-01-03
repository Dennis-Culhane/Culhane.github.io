const fs = require('fs');
const path = require('path');

async function generateSitemap() {
    try {
        // 读取文章数据
        const articlesData = JSON.parse(
            fs.readFileSync(path.join(__dirname, '../data/articles.json'), 'utf8')
        );

        // 基础 URL
        const baseUrl = 'https://dennisculhane.com';
        
        // 生成 sitemap 内容
        let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
        sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
        
        // 添加主页
        sitemap += `  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>\n`;
        
        // 为每篇文章添加 URL
        articlesData.forEach(article => {
            sitemap += `  <url>
    <loc>${baseUrl}/article/${encodeURIComponent(article.id)}</loc>
    <lastmod>${article.date || new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>\n`;
        });
        
        sitemap += '</urlset>';
        
        // 写入 sitemap.xml
        fs.writeFileSync(path.join(__dirname, '../sitemap.xml'), sitemap);
        console.log('Sitemap generated successfully!');
        
    } catch (error) {
        console.error('Error generating sitemap:', error);
    }
}

generateSitemap(); 