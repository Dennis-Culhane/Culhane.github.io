// 显示研究领域
function displayResearchAreas() {
    const container = document.getElementById('research-areas');
    researchAreas.forEach(area => {
        const tag = document.createElement('span');
        tag.className = 'bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full';
        tag.textContent = area;
        container.appendChild(tag);
    });
}

// 显示简短简介
function displayBio() {
    document.getElementById('short-bio').textContent = shortBio;
    document.getElementById('bio-content').innerHTML = fullBio;
}

// 显示文章类别过滤器
function displayCategoryFilter() {
    const container = document.getElementById('category-filter');
    const articles = window.getArticlesFromStorage();
    const categories = [...new Set(articles.flatMap(article => article.categories))];
    
    container.innerHTML = `
        <div class="flex flex-wrap gap-2">
            <button 
                class="category-btn active bg-blue-600 text-white px-4 py-2 rounded-md text-sm"
                data-category="all"
            >
                All
            </button>
            ${categories.map(category => `
                <button 
                    class="category-btn bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-md text-sm"
                    data-category="${category}"
                >
                    ${category}
                </button>
            `).join('')}
        </div>
    `;

    // 添加过滤器事件监听
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', () => filterArticles(btn.dataset.category));
    });
}

// 显示文章列表
function displayArticles(filteredArticles) {
    // 如果没有传入过滤后的文章，则从存储中获取所有文章
    const articles = filteredArticles || window.getArticlesFromStorage();
    const container = document.getElementById('articles-list');
    
    container.innerHTML = articles.map(article => `
        <div class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <h3 class="text-xl font-semibold mb-2">
                <a href="#" class="hover:text-blue-600" onclick="showArticleModal(${article.id}); return false;">
                    ${article.title}
                </a>
            </h3>
            <div class="flex flex-wrap gap-2 mb-3">
                ${article.categories.map(category => 
                    `<span class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                        ${category}
                    </span>`
                ).join('')}
            </div>
            <p class="text-gray-600 text-sm mb-2">${article.authors}</p>
            <p class="text-gray-500 text-sm">${article.date}</p>
        </div>
    `).join('');
}

// 过滤文章
function filterArticles(category) {
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active', 'bg-blue-600', 'text-white');
        btn.classList.add('bg-gray-200');
    });
    
    const activeBtn = document.querySelector(`[data-category="${category}"]`);
    activeBtn.classList.add('active', 'bg-blue-600', 'text-white');
    activeBtn.classList.remove('bg-gray-200');

    const articles = window.getArticlesFromStorage();
    const filteredArticles = category === 'all' 
        ? articles 
        : articles.filter(article => article.categories.includes(category));
    
    displayArticles(filteredArticles);
}

// 显示文章详情模态框
function showArticleModal(articleId) {
    const articles = window.getArticlesFromStorage();
    const article = articles.find(a => a.id === articleId);
    if (!article) return;

    document.getElementById('modal-title').textContent = article.title;
    document.getElementById('modal-authors').textContent = article.authors;
    document.getElementById('modal-date').textContent = article.date;
    document.getElementById('modal-abstract').textContent = article.abstract;
    
    // 设置下载按钮
    const downloadBtn = document.querySelector('#modal-download a');
    if (downloadBtn) {
        downloadBtn.href = article.pdfUrl;
        downloadBtn.textContent = 'Download';
    }
    
    // 设置分类标签
    document.getElementById('modal-categories').innerHTML = article.categories
        .map(category => `
            <span class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                ${category}
            </span>
        `).join('');

    // 生成文章 slug
    const slug = ArticlesManager.generateSlug(article);
    
    // 添加复制链接按钮
    const downloadDiv = document.getElementById('modal-download');
    // 移除现有的复制按钮（如果存在）
    const existingCopyBtn = downloadDiv.querySelector('.copy-link-btn');
    if (existingCopyBtn) {
        existingCopyBtn.remove();
    }
    
    // 创建新的复制按钮
    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-link-btn inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 ml-2';
    copyBtn.innerHTML = `
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
        </svg>
        Copy Link
    `;
    
    // 添加点击事件
    copyBtn.addEventListener('click', () => {
        const url = `${window.location.origin}${window.location.pathname}#article=${slug}`;
        navigator.clipboard.writeText(url).then(() => {
            copyBtn.textContent = 'Copied!';
            setTimeout(() => {
                copyBtn.innerHTML = `
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                            d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                    Copy Link
                `;
            }, 2000);
        });
    });
    
    // 将复制按钮添加到下载按钮旁边
    downloadDiv.appendChild(copyBtn);

    // 显示模态框
    document.getElementById('article-modal').classList.remove('hidden');
    document.getElementById('article-modal').classList.add('flex');
}

// 关闭文章详情模态框
function closeModal() {
    document.getElementById('article-modal').classList.add('hidden');
    document.getElementById('article-modal').classList.remove('flex');
}

// 显示完整简介模态框
function showBioModal() {
    document.getElementById('bio-modal').classList.remove('hidden');
    document.getElementById('bio-modal').classList.add('flex');
}

// 关闭简介模态框
function closeBioModal() {
    document.getElementById('bio-modal').classList.add('hidden');
    document.getElementById('bio-modal').classList.remove('flex');
}

// 添加复制链接功能
function copyArticleLink(slug) {
    const url = `${window.location.origin}${window.location.pathname}#article=${slug}`;
    navigator.clipboard.writeText(url).then(() => {
        // 显示复制成功提示
        const copyBtn = event.target;
        const originalText = copyBtn.textContent;
        copyBtn.textContent = 'Copied!';
        setTimeout(() => {
            copyBtn.textContent = originalText;
        }, 2000);
    });
}

// 处理 URL hash 变化
function handleHashChange() {
    const hash = window.location.hash;
    if (hash.startsWith('#article=')) {
        const slug = hash.replace('#article=', '');
        const articleCard = document.querySelector(`[data-article-slug="${slug}"]`);
        if (articleCard) {
            // 滚动到文章位置
            articleCard.scrollIntoView({ behavior: 'smooth' });
            // 延迟打开文章详情
            setTimeout(() => {
                const article = window.getArticlesFromStorage().find(a => 
                    ArticlesManager.generateSlug(a) === slug
                );
                if (article) {
                    showArticleModal(article.id);
                }
            }, 500);
        }
    }
}

// 初始化页面
document.addEventListener('DOMContentLoaded', () => {
    // 确保数据已经初始化
    if (!localStorage.getItem('articles')) {
        window.saveArticlesToStorage();
    }
    
    displayResearchAreas();
    displayBio();
    displayCategoryFilter();
    displayArticles();
    
    // 设置年份
    document.getElementById('current-year').textContent = new Date().getFullYear();
    
    // 设置 Read More 按钮事件
    document.getElementById('read-more-btn').addEventListener('click', showBioModal);
    
    // 添加 hash 变化监听
    window.addEventListener('hashchange', handleHashChange);
    
    // 检查初始 URL 是否包含文章链接
    if (window.location.hash) {
        handleHashChange();
    }
}); 