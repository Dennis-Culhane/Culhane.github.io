// 定义全局初始化函数，区分admin和普通页面
window.initializePage = async function(isAdmin = false) {
    // 检查是否已有token
    const token = sessionStorage.getItem('github_token');
    if (token) {
        try {
            if (await checkToken(token)) {
                document.getElementById('token-input-section').classList.add('hidden');
                document.getElementById('main-content').classList.remove('hidden');
                await ArticlesManager.renderArticles();
            } else {
                sessionStorage.removeItem('github_token');
            }
        } catch (error) {
            console.error('Error during initialization:', error);
            sessionStorage.removeItem('github_token');
        }
    }
}

// Shared data handling functions
window.ArticlesManager = {
    // Get articles from GitHub storage
    async getArticles(requireToken = false) {
        try {
            const token = sessionStorage.getItem('github_token');
            if (!token && requireToken) {
                console.log('No GitHub token found, returning empty array');
                return [];
            }

            const headers = {
                'Accept': 'application/vnd.github.v3+json'
            };
            
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`${config.apiBaseUrl}/contents/data/articles.json`, {
                headers: headers
            });

            if (response.status === 404) {
                return [];
            }

            const data = await response.json();
            return JSON.parse(atob(data.content));
        } catch (error) {
            console.error('Error fetching articles:', error);
            return [];
        }
    },

    // Save articles to GitHub storage (需要 token)
    async saveArticles(articles, retryCount = 0) {
        try {
            // 最大重试次数
            const MAX_RETRIES = 3;
            if (retryCount >= MAX_RETRIES) {
                throw new Error('Maximum retry attempts reached');
            }

            const token = sessionStorage.getItem('github_token');
            if (!token) {
                throw new Error('GitHub token is not set');
            }

            if (!Array.isArray(articles)) {
                console.error('Articles is not an array:', articles);
                articles = [];
            }

            // Validate each article
            articles = articles.filter(article => {
                try {
                    return article && article.id && article.title && article.authors;
                } catch (error) {
                    console.warn('Invalid article filtered out:', article);
                    return false;
                }
            });

            console.log('Saving articles:', articles);

            // Convert to JSON string with pretty printing
            const jsonContent = JSON.stringify(articles, null, 2);
            console.log('JSON content to save:', jsonContent);

            // Convert to base64
            const base64Content = btoa(unescape(encodeURIComponent(jsonContent)));

            // 获取最新的SHA
            const checkResponse = await fetch(`${config.apiBaseUrl}/contents/${config.articlesPath}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (!checkResponse.ok) {
                if (checkResponse.status !== 404) {
                    throw new Error('Failed to check file status');
                }
            }
            
            const fileData = checkResponse.ok ? await checkResponse.json() : null;
            const sha = fileData ? fileData.sha : null;

            // Prepare request body
            const body = {
                message: `[skip ci] Batch update articles`,
                content: base64Content,
                branch: window.GITHUB_CONFIG.BRANCH
            };

            if (sha) {
                body.sha = sha;
            }

            // Save to GitHub
            const response = await fetch(`${config.apiBaseUrl}/contents/${config.articlesPath}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/vnd.github.v3+json'
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errorData = await response.json();
                if (errorData.message.includes('does not match')) {
                    // 如果SHA不匹配，等待一段时间后重试
                    const delay = Math.min(1000 * Math.pow(2, retryCount), 5000); // 指数退避，最大5秒
                    console.log(`SHA mismatch, retrying in ${delay}ms... (attempt ${retryCount + 1}/${MAX_RETRIES})`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    return await this.saveArticles(articles, retryCount + 1);
                }
                throw new Error(`GitHub API Error: ${errorData.message}`);
            }

            // 等待文件保存完成
            await new Promise(resolve => setTimeout(resolve, 1000));

            console.log('Articles saved successfully');
            return true;
        } catch (error) {
            if (error.message === 'Maximum retry attempts reached') {
                console.error('Failed to save articles after maximum retries');
            }
            console.error('Error saving articles:', error);
            throw error;
        }
    },

    // Upload PDF file to GitHub (需要 token)
    async uploadPDF(file) {
        try {
            const token = sessionStorage.getItem('github_token');
            if (!token) {
                throw new Error('GitHub token is not set');
            }

            if (!file) {
                throw new Error('PDF file is required');
            }

            console.log('Uploading PDF:', file.name);

            // Convert file to base64
            const base64Content = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    try {
                        const base64 = reader.result.split(',')[1];
                        if (!base64) {
                            reject(new Error('Failed to convert file to base64'));
                            return;
                        }
                        resolve(base64);
                    } catch (error) {
                        reject(error);
                    }
                };
                reader.onerror = () => reject(new Error('Failed to read file'));
                reader.readAsDataURL(file);
            });

            // Create papers directory if it doesn't exist
            try {
                const dirResponse = await fetch(`${config.apiBaseUrl}/contents/${config.pdfStoragePath}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                });

                if (!dirResponse.ok && dirResponse.status !== 404) {
                    throw new Error('Failed to check papers directory');
                }
            } catch (error) {
                console.log('Creating papers directory...');
            }

            // Check if file exists
            let sha = '';
            try {
                const checkResponse = await fetch(`${config.apiBaseUrl}/contents/${config.pdfStoragePath}${encodeURIComponent(file.name)}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                });
                
                if (checkResponse.ok) {
                    const data = await checkResponse.json();
                    sha = data.sha;
                }
            } catch (error) {
                console.log('No existing file found');
            }

            // Prepare request body
            const body = {
                message: `Upload PDF: ${file.name}`,
                content: base64Content,
                branch: window.GITHUB_CONFIG.BRANCH
            };

            if (sha) {
                body.sha = sha;
            }

            // Upload to GitHub
            const response = await fetch(`${config.apiBaseUrl}/contents/${config.pdfStoragePath}${encodeURIComponent(file.name)}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/vnd.github.v3+json'
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Failed to upload PDF: ${errorData.message}`);
            }

            // 等待文件上传完成
            await new Promise(resolve => setTimeout(resolve, 1000));

            console.log('PDF uploaded successfully');
            // Generate the raw URL for the PDF
            const pdfUrl = `${config.rawBaseUrl}/${config.pdfStoragePath}${encodeURIComponent(file.name)}`;
            console.log('PDF URL:', pdfUrl);
            return pdfUrl;
        } catch (error) {
            console.error('Error uploading PDF:', error);
            throw error;
        }
    },

    // Add new article (需要 token)
    async addArticle(articleData) {
        try {
            const token = sessionStorage.getItem('github_token');
            if (!token) {
                throw new Error('GitHub token is not set');
            }

            if (!articleData || !articleData.title || !articleData.authors) {
                throw new Error('Article title and authors are required');
            }

            if (!articleData.pdfUrl || !articleData.pdfUrl.trim()) {
                throw new Error('URL is required');
            }

            // 验证URL格式
            try {
                new URL(articleData.pdfUrl);
            } catch (e) {
                throw new Error('Invalid URL format');
            }

            // Get current articles first
            let articles = await this.getArticles(true);
            console.log('Current articles:', articles);

            // Ensure articles is an array
            if (!Array.isArray(articles)) {
                console.log('Articles is not an array, initializing empty array');
                articles = [];
            }

            // 处理 categories
            let categories = [];
            if (articleData.categories) {
                if (Array.isArray(articleData.categories)) {
                    categories = articleData.categories;
                } else if (typeof articleData.categories === 'string') {
                    // 只使用分号作为分隔符
                    categories = articleData.categories
                        .split(';')  // 只使用分号分隔
                        .map(cat => cat.trim())
                        .filter(Boolean);  // 移除空值
                }
            }

            const newArticle = {
                id: Date.now().toString(),
                title: articleData.title.trim(),
                authors: articleData.authors.trim(),
                date: articleData.date || getCurrentDateString(),
                categories: categories,
                abstract: articleData.abstract ? articleData.abstract.trim() : '',
                pdfUrl: articleData.pdfUrl.trim()
            };

            // 确保日期格式正确
            if (newArticle.date) {
                // 如果不是标准的YYYY-MM-DD格式，尝试重新格式化
                if (!/^\d{4}-\d{2}-\d{2}$/.test(newArticle.date)) {
                    newArticle.date = formatExcelDate(newArticle.date);
                }
            }
            
            console.log('New article object:', newArticle);

            // Add to articles array
            articles.push(newArticle);

            // Save updated articles
            await this.saveArticles(articles);
            console.log('New article added successfully:', newArticle);

            // 添加成功后发送邮件通知
            try {
                const followers = await FollowersManager.getFollowers();
                if (followers.length > 0) {
                    // 这里需要实现你的邮件发送逻辑
                    // 可以使用第三方服务如 SendGrid、Mailgun 等
                    // 或者使用自己的邮件服务器
                    console.log('Sending notification to followers:', followers);
                    
                    // 示例：使用 Email.js 发送邮件
                    for (const email of followers) {
                        await emailjs.send(
                            'YOUR_SERVICE_ID',
                            'YOUR_TEMPLATE_ID',
                            {
                                to_email: email,
                                article_title: articleData.title,
                                article_authors: articleData.authors,
                                article_url: articleData.pdfUrl
                            },
                            'YOUR_USER_ID'
                        );
                    }
                }
            } catch (error) {
                console.error('Error sending notifications:', error);
                // 继续行，不影响文章添加
            }

            return newArticle;
        } catch (error) {
            console.error('Error adding article:', error);
            throw error;
        }
    },

    // Delete article (需要 token)
    async deleteArticle(id) {
        try {
            const token = sessionStorage.getItem('github_token');
            if (!token) {
                throw new Error('GitHub token is not set');
            }

            if (!id) {
                throw new Error('Article ID is required');
            }

            let articles = await this.getArticles(true);
            if (!Array.isArray(articles)) {
                articles = [];
                return;
            }

            // Find the article to get its PDF filename
            const article = articles.find(a => a.id === id);
            if (!article) {
                throw new Error('Article not found');
            }

            if (article.fileName) {
                // Try to delete the PDF file
                try {
                    // Get the PDF file SHA
                    const pdfResponse = await fetch(`${config.apiBaseUrl}/contents/${config.pdfStoragePath}${encodeURIComponent(article.fileName)}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Accept': 'application/vnd.github.v3+json'
                        }
                    });

                    if (pdfResponse.ok) {
                        const pdfData = await pdfResponse.json();
                        // Delete the PDF file
                        const deleteResponse = await fetch(`${config.apiBaseUrl}/contents/${config.pdfStoragePath}${encodeURIComponent(article.fileName)}`, {
                            method: 'DELETE',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json',
                                'Accept': 'application/vnd.github.v3+json'
                            },
                            body: JSON.stringify({
                                message: `[skip ci] Delete article ${id}`,
                                sha: pdfData.sha,
                                branch: window.GITHUB_CONFIG.BRANCH
                            })
                        });

                        if (!deleteResponse.ok) {
                            const errorData = await deleteResponse.json();
                            console.error('Failed to delete PDF:', errorData);
                        }
                    }
                } catch (error) {
                    console.error('Error deleting PDF file:', error);
                    // Continue with article deletion even if PDF deletion fails
                }
            }

            // Remove the article from the array
            articles = articles.filter(article => article.id !== id);

            // Save the updated articles
            await this.saveArticles(articles);
            
            return true;
        } catch (error) {
            console.error('Error deleting article:', error);
            throw error;
        }
    },

    // Render articles list
    async renderArticles(containerId = 'articles-list', isAdmin = false) {
        try {
            // 如果是管理页面，使用 token 获取数据
            let articles = await this.getArticles(isAdmin);
            console.log('Rendering articles:', articles);

            const container = document.getElementById(containerId);
            if (!container) {
                console.warn(`Container ${containerId} not found`);
                return;
            }

            if (!Array.isArray(articles) || articles.length === 0) {
                container.innerHTML = '<p class="text-gray-500 text-center">No articles found.</p>';
                return;
            }

            // Sort articles by date (newest first)
            articles.sort((a, b) => {
                const dateA = a.date ? new Date(a.date) : new Date(0);
                const dateB = b.date ? new Date(b.date) : new Date(0);
                return dateB - dateA;
            });

            // 使用文章卡片样式渲染
            container.innerHTML = articles.map(article => {
                try {
                    const articleSlug = this.generateSlug(article);
                    return `
                        <div class="article-card" data-article-slug="${articleSlug}">
                            <h2 class="title-ellipsis">${article.title || 'Untitled'}</h2>
                            <p class="authors-ellipsis">${article.authors || 'Unknown'}</p>
                            <p class="categories-ellipsis">${article.categories ? article.categories.join(', ') : ''}</p>
                            <p class="abstract-clamp">${article.abstract || 'No abstract available'}</p>
                            <div class="mt-4 flex gap-4">
                                <a href="${article.pdfUrl}" target="_blank" 
                                   class="text-blue-600 hover:text-blue-800">
                                   View Article
                                </a>
                                <button onclick="copyArticleLink('${articleSlug}')"
                                    class="hidden copy-link-btn text-gray-600 hover:text-gray-800">
                                    Copy Link
                                </button>
                            </div>
                        </div>
                    `;
                } catch (error) {
                    console.error('Error rendering article:', error, article);
                    return '';
                }
            }).filter(Boolean).join('');
            
            console.log('Articles rendered successfully');
        } catch (error) {
            console.error('Error rendering articles:', error);
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = `<p class="text-red-500 text-center">Error loading articles: ${error.message}</p>`;
            }
        }
    },

    async updateArticle(articleData, pdfFile = null) {
        const token = sessionStorage.getItem('github_token');
        if (!token) {
            throw new Error('GitHub token not found');
        }

        try {
            // 获取现有文章
            const articles = await this.getArticles();
            const index = articles.findIndex(a => String(a.id) === String(articleData.id));
            
            if (index === -1) {
                throw new Error('Article not found');
            }

            // 如果有新的PDF文件
            if (pdfFile && pdfFile.size > 0) {
                const pdfUrl = await this.uploadPDF(pdfFile);
                articleData.pdfUrl = pdfUrl;
            } else {
                // 保持原有的 pdfUrl
                articleData.pdfUrl = articles[index].pdfUrl;
            }

            // 更新文章数据
            articles[index] = {
                ...articles[index],
                ...articleData,
                lastModified: getCurrentDateString()
            };

            // 确保日期格式正确
            if (articles[index].date) {
                // 如果不是标准的YYYY-MM-DD格式，尝试重新格式化
                if (!/^\d{4}-\d{2}-\d{2}$/.test(articles[index].date)) {
                    articles[index].date = formatExcelDate(articles[index].date);
                }
            }

            // 获取现有文件的 SHA
            const response = await fetch(`${config.apiBaseUrl}/contents/${config.articlesPath}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            const fileInfo = await response.json();
            const sha = fileInfo.sha;

            // 更新文件
            const content = btoa(JSON.stringify(articles, null, 2));
            await fetch(`${config.apiBaseUrl}/contents/${config.articlesPath}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/vnd.github.v3+json'
                },
                body: JSON.stringify({
                    message: `[skip ci] Update: ${articleData.title.substring(0, 50)}...`,
                    content: content,
                    sha: sha,
                    branch: window.GITHUB_CONFIG.BRANCH
                })
            });

            return articles[index];
        } catch (error) {
            console.error('Error updating article:', error);
            throw new Error('Failed to update article: ' + error.message);
        }
    },

    async batchSaveArticles(articles, operation = 'update') {
        const token = sessionStorage.getItem('github_token');
        if (!token) {
            throw new Error('GitHub token not found');
        }

        try {
            // 获取现有文件的 SHA
            const response = await fetch(`${config.apiBaseUrl}/contents/${config.articlesPath}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            const fileInfo = await response.json();
            const sha = fileInfo.sha;

            // 更新文件
            const content = btoa(JSON.stringify(articles, null, 2));
            await fetch(`${config.apiBaseUrl}/contents/${config.articlesPath}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/vnd.github.v3+json'
                },
                body: JSON.stringify({
                    message: `[skip ci] Batch ${operation} articles`,
                    content: content,
                    sha: sha,
                    branch: window.GITHUB_CONFIG.BRANCH
                })
            });

            return articles;
        } catch (error) {
            console.error('Error in batch operation:', error);
            throw new Error('Failed to perform batch operation: ' + error.message);
        }
    },

    // 生成文章 slug
    generateSlug(article) {
        let dateStr = '';
        if (article.date) {
            // 如果已经是YYYY-MM-DD格式，直接使用
            if (/^\d{4}-\d{2}-\d{2}$/.test(article.date)) {
                dateStr = article.date;
            } else {
                // 否则尝试格式化日期，避免时区问题
                dateStr = formatExcelDate(article.date);
            }
        }
        
        const titleSlug = article.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
        return `${dateStr}-${titleSlug}`;
    }
};

// 验证token是否有效
async function checkToken(token) {
    try {
        if (!token || typeof token !== 'string') {
            console.error('Invalid token format');
            return false;
        }

        const response = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!response.ok) {
            console.error('Token verification failed:', response.status, response.statusText);
            return false;
        }
        
        try {
            const data = await response.json();
            if (!data || !data.login) {
                console.error('Invalid response data');
                return false;
            }
            return true;
        } catch (e) {
            console.error('Failed to parse response:', e);
            return false;
        }

    } catch (error) {
        console.error('Token verification error:', error);
        return false;
    }
}

// 读取Excel文件
function readExcelFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                resolve(workbook);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

// 格式化Excel日期
function formatExcelDate(excelDate) {
    if (!excelDate) return '';
    
    // 尝试解析日期字符串
    if (typeof excelDate === 'string') {
        // 如果已经是标准日期格式（YYYY-MM-DD），直接返回
        if (/^\d{4}-\d{2}-\d{2}$/.test(excelDate)) {
            return excelDate;
        }
        
        // 处理只有年份的情况(如 "2023")
        if (/^\d{4}$/.test(excelDate)) {
            return `${excelDate}-01-01`;
        }
        
        // 处理年月格式(如 "2023-05" 或 "2023/05")
        if (/^\d{4}[-\/]\d{1,2}$/.test(excelDate)) {
            const parts = excelDate.split(/[-\/]/);
            return `${parts[0]}-${parts[1].padStart(2, '0')}-01`;
        }
        
        // 处理斜杠分隔的日期格式
        // 格式: MM/DD/YYYY 或 DD/MM/YYYY
        const slashRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
        if (slashRegex.test(excelDate)) {
            const parts = excelDate.split('/');
            // 假设第一个数字如果小于等于12是月份，否则是日期
            if (parseInt(parts[0]) <= 12) {
                // 美式格式 MM/DD/YYYY
                return `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
            } else {
                // 欧式格式 DD/MM/YYYY
                return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            }
        }
        
        // 格式: YYYY/MM/DD
        const yearFirstRegex = /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/;
        if (yearFirstRegex.test(excelDate)) {
            const parts = excelDate.split('/');
            return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
        }
        
        // 尝试解析为日期对象
        try {
            // 检查是否格式为带T的ISO格式
            if (excelDate.includes('T')) {
                // 使用ISO格式创建日期对象
                const date = new Date(excelDate);
                if (!isNaN(date.getTime())) {
                    // 创建一个不受时区影响的日期字符串
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    return `${year}-${month}-${day}`;
                }
            } else {
                // 对于"YYYY-MM-DD"格式，确保不会因时区而改变日期
                if (excelDate.match(/^\d{4}-\d{1,2}-\d{1,2}$/)) {
                    const parts = excelDate.split('-');
                    return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
                }
                
                // 对于其他日期字符串，创建日期并添加一天来修正时区问题
                const date = new Date(excelDate);
                if (!isNaN(date.getTime())) {
                    // 使用时区调整函数
                    const adjustedDate = adjustDateForTimezone(date);
                    const year = adjustedDate.getFullYear();
                    const month = String(adjustedDate.getMonth() + 1).padStart(2, '0');
                    const day = String(adjustedDate.getDate()).padStart(2, '0');
                    return `${year}-${month}-${day}`;
                }
            }
        } catch (e) {
            console.warn('Failed to parse date string:', excelDate, e);
        }
    }
    
    // 将Excel日期数字转换为JavaScript日期
    if (typeof excelDate === 'number') {
        try {
            // Excel的日期是从1900年1月1日开始的天数
            // 25569是1970年1月1日相对于Excel纪元的天数
            const msPerDay = 86400 * 1000;
            const excelEpochDiff = 25569; // Excel纪元与JS纪元的差值（天数）
            
            // 修复：为了防止时区问题导致的日期偏差，这里加上一天（24小时）
            const utcDays = excelDate - excelEpochDiff;
            const utcMilliseconds = utcDays * msPerDay;
            // 创建日期对象
            const date = new Date(utcMilliseconds);
            
            if (!isNaN(date.getTime())) {
                // 使用时区调整函数
                const adjustedDate = adjustDateForTimezone(date);
                const year = adjustedDate.getFullYear();
                const month = String(adjustedDate.getMonth() + 1).padStart(2, '0');
                const day = String(adjustedDate.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            }
        } catch (error) {
            console.warn('Failed to parse Excel date:', excelDate);
        }
    }
    
    // 如果所有尝试都失败，返回当前日期
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// 调整日期以适应时区
function adjustDateForTimezone(date) {
    // 获取当前时区偏移（分钟）
    const timezoneOffset = date.getTimezoneOffset();
    
    // 如果时区偏移为负数（东八区等为负数，格林威治为0，西方为正数）
    // 且日期时间为午夜，则可能需要添加一天
    if (timezoneOffset < 0 && date.getUTCHours() === 0) {
        // 创建一个新的日期对象，加上一天
        const adjustedDate = new Date(date);
        adjustedDate.setDate(adjustedDate.getDate() + 1);
        return adjustedDate;
    }
    
    return date;
}

// 在处理Excel导入的函数中
function processExcelData(data) {
    return data.map(row => ({
        // ... 其他字段 ...
        categories: row.categories ? row.categories.split(';').map(c => c.trim()) : [],
        // ... 其他字段 ...
    }));
}

// 获取当前日期的YYYY-MM-DD格式字符串，考虑时区
function getCurrentDateString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}