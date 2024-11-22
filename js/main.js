window.professorData = {
    name: "Dennis P. Culhane",
    title: "Faculty Member",
    researchAreas: [
        "Homelessness",
        "Housing Policy",
        "Service Systems",
        "Policy Analysis",
        "Systems Reform"
    ],
    shortBio: `Dr. Culhane's primary area of research is homelessness and assisted housing policy. His most recent research has focused on the premature aging of the adult homeless population on service systems use and costs.

Dr. Culhane co-directs the Actionable Intelligence for Social Policy initiative, a MacArthur-initiated network to promote the development of integrated database systems (IDS) by states and localities for policy analysis and systems reform. Funding from the Annie E. Casey foundation is supporting a training and technical assistance effort for states and local governments working toward implementation of an IDS.`,
    email: "culhane@upenn.edu",
    fullBio: `Dr. Culhane's primary area of research is homelessness and assisted housing policy. His most recent research has focused on the premature aging of the adult homeless population on service systems use and costs.

Dr. Culhane co-directs the Actionable Intelligence for Social Policy initiative, a MacArthur-initiated network to promote the development of integrated database systems (IDS) by states and localities for policy analysis and systems reform. Funding from the Annie E. Casey foundation is supporting a training and technical assistance effort for states and local governments working toward implementation of an IDS.

`
};

document.addEventListener('DOMContentLoaded', function() {
    // 从 localStorage 获取文章数据
    const storedArticles = JSON.parse(localStorage.getItem('articles') || '[]');
    
    // 初始化渲染
    initializeAndRender();

    function initializeAndRender() {
        // 首先渲染分类过滤器
        renderCategoryFilter();
        // 然后渲染所有文章
        renderArticles(storedArticles);
    }

    function renderCategoryFilter() {
        // 获取所有唯一的分类
        const allCategories = ['all', ...new Set(storedArticles.flatMap(article => 
            Array.isArray(article.categories) ? article.categories : []
        ))];

        const categoryFilter = document.getElementById('category-filter');
        if (categoryFilter) {
            categoryFilter.innerHTML = `
                <h2 class="text-lg font-semibold mb-3">Filter by Category</h2>
                <div class="flex flex-wrap gap-2">
                    ${allCategories.map(category => `
                        <button
                            data-category="${category}"
                            class="px-4 py-2 rounded-full text-sm font-medium transition-colors
                                ${category === 'all' 
                                    ? 'bg-blue-600 text-white' 
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
                        >
                            ${category === 'all' ? 'All Categories' : category}
                        </button>
                    `).join('')}
                </div>
            `;

            // 添加点击事件监听器
            categoryFilter.addEventListener('click', function(e) {
                if (e.target.tagName === 'BUTTON') {
                    const selectedCategory = e.target.dataset.category;
                    
                    // 更新按钮样式
                    categoryFilter.querySelectorAll('button').forEach(btn => {
                        btn.className = `px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                            btn.dataset.category === selectedCategory
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`;
                    });

                    // 过滤并渲染文章
                    if (selectedCategory === 'all') {
                        renderArticles(storedArticles);
                    } else {
                        const filteredArticles = storedArticles.filter(article => 
                            Array.isArray(article.categories) && 
                            article.categories.includes(selectedCategory)
                        );
                        renderArticles(filteredArticles);
                    }
                }
            });
        }
    }

    // 渲染文章列表
    function renderArticles(articlesToRender) {
        const articlesList = document.getElementById('articles-list');
        if (!articlesList) return;
        
        articlesList.innerHTML = '';
        
        articlesToRender.forEach(article => {
            const articleElement = document.createElement('div');
            articleElement.className = 'bg-white rounded-lg shadow-md p-6';
            
            // 创建标签HTML，添加安全检查
            const categoriesHtml = (article.categories || [])
                .map(category => `
                    <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                        ${category}
                    </span>
                `).join('');
            
            // 添加所有字段的安全检查
            const abstract = String(article.abstract || '');
            const title = String(article.title || '');
            const authors = String(article.authors || '');
            const date = String(article.date || '');
            
            articleElement.innerHTML = `
                <div class="flex flex-wrap gap-2 mb-3">
                    ${categoriesHtml}
                    <span class="text-gray-600 text-sm">${date}</span>
                </div>
                <h3 class="text-xl font-semibold mb-2">
                    <a href="#" class="hover:text-blue-600">${title}</a>
                </h3>
                <p class="text-gray-600 mb-4">${authors}</p>
                <p class="text-gray-700">${abstract.length > 200 ? abstract.substring(0, 200) + '...' : abstract}</p>
            `;
            
            // 添加点击事件以显示模态框
            articleElement.querySelector('h3 a').addEventListener('click', (e) => {
                e.preventDefault();
                showModal(article);
            });
            
            articlesList.appendChild(articleElement);
        });
    }

    // 显示模态框
    function showModal(article) {
        const modal = document.getElementById('article-modal');
        document.getElementById('modal-title').textContent = article.title || '';
        
        // 渲染多个标签，添加安全检查
        const categoriesContainer = document.getElementById('modal-categories');
        categoriesContainer.innerHTML = (article.categories || [])
            .map(category => `
                <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                    ${category}
                </span>
            `).join('');
        
        document.getElementById('modal-date').textContent = article.date || '';
        document.getElementById('modal-authors').textContent = article.authors || '';
        document.getElementById('modal-abstract').textContent = article.abstract || '';
        
        // 处理PDF下载链接
        const modalPdf = document.getElementById('modal-pdf');
        if (article.pdf && article.pdf.startsWith('data:')) {
            // 对于Base64编码的PDF，创建一个临时下载链接
            modalPdf.href = article.pdf;
            modalPdf.download = article.fileName || 'document.pdf';
        } else {
            // 对于URL类型的PDF
            modalPdf.href = article.pdf || '#';
            modalPdf.download = '';
        }
        
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
    
    // 设置年份
    document.getElementById('current-year').textContent = new Date().getFullYear();

    // 渲染研究领域
    const researchAreasContainer = document.getElementById('research-areas');
    if (window.professorData && researchAreasContainer) {
        professorData.researchAreas.forEach(area => {
            const span = document.createElement('span');
            span.className = 'bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm';
            span.textContent = area;
            researchAreasContainer.appendChild(span);
        });
    }

    // 设置简短简历
    const shortBioElement = document.getElementById('short-bio');
    if (window.professorData && shortBioElement) {
        shortBioElement.textContent = professorData.shortBio;
    }

    // 修改 Read More 按钮的事件监听
    const readMoreBtn = document.getElementById('read-more-btn');
    if (readMoreBtn) {
        readMoreBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showBioModal();
        });
    }

    // 添加 Bio Modal 背景点击关闭事件
    const bioModal = document.getElementById('bio-modal');
    if (bioModal) {
        bioModal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeBioModal();
            }
        });
    }
});

// 关闭模态框功能
function closeModal() {
    const modal = document.getElementById('article-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

// 添加键盘事件监听器关闭模态框
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeModal();
    }
});

// 点击模态框背景关闭
document.getElementById('article-modal')?.addEventListener('click', function(e) {
    if (e.target === this) {
        closeModal();
    }
});

// 修改 showBioModal 函数
function showBioModal() {
    const bioModal = document.getElementById('bio-modal');
    const bioContent = document.getElementById('bio-content');
    
    // 设置内容
    bioContent.innerHTML = window.professorData.fullBio.split('\n\n').map(paragraph => 
        `<p class="mb-4 text-gray-700">${paragraph}</p>`
    ).join('');
    
    // 显示模态框
    bioModal.classList.remove('hidden');
    bioModal.classList.add('flex');
    document.body.style.overflow = 'hidden';
}

// 修改关闭模态框函数
window.closeBioModal = function() {
    const bioModal = document.getElementById('bio-modal');
    if (bioModal) {
        bioModal.classList.add('hidden');
        bioModal.classList.remove('flex');
        document.body.style.overflow = '';
    }
};

// 添加 ESC 键关闭模态框
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeBioModal();
    }
});

// 添加点击背景关闭模态框
document.addEventListener('click', function(e) {
    const bioModal = document.getElementById('bio-modal');
    if (bioModal && e.target === bioModal) {
        closeBioModal();
    }
}); 