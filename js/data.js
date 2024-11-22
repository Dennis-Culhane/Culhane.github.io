// 初始文章数据
const initialArticlesData = [
    {
        id: "1",
        title: "Understanding Homelessness Among Veterans",
        authors: ["Dennis P. Culhane", "Jane Doe"],
        category: "Homelessness",
        publicationDate: "2023-05-20",
        abstract: "This study explores the factors contributing to homelessness among veterans and evaluates the effectiveness of existing support systems. The research highlights key challenges and proposes potential solutions for addressing veteran homelessness.",
        pdfUrl: "#"
    },
    {
        id: "2",
        title: "Housing Policy Impact Analysis",
        authors: ["Dennis P. Culhane", "John Smith"],
        category: "Assisted Housing Policy",
        publicationDate: "2023-03-15",
        abstract: "An analysis of the impact of housing policies on community welfare and social stability. This comprehensive study examines various policy implementations and their outcomes across different demographics.",
        pdfUrl: "#"
    },
    {
        id: "3",
        title: "Research Methods in Social Policy",
        authors: ["Dennis P. Culhane"],
        category: "Policy Analysis Research Methods",
        publicationDate: "2023-01-10",
        abstract: "A comprehensive overview of research methods used in social policy analysis, focusing on data collection, analysis techniques, and interpretation of results in the context of social policy research.",
        pdfUrl: "#"
    }
];

// 从 localStorage 获取文章数据，如果没有则使用初始数据
const articlesData = JSON.parse(localStorage.getItem('articlesData')) || initialArticlesData;

// 教授数据
const professorData = {
    name: "Dennis P. Culhane",
    position: "Faculty Member",
    photoUrl: "https://via.placeholder.com/200",
    email: "dennis.culhane@example.edu",
    researchAreas: ["Homelessness", "Assisted Housing Policy", "Policy Analysis Research Methods"],
    biography: "完整的传记...",
    shortBio: "Dr. Dennis P. Culhane is a social science researcher with primary expertise in the area of homelessness and assisted housing policy."
};

// 更新文章数据的函数
function updateArticles(newArticles) {
    window.articlesData = newArticles;
    localStorage.setItem('articlesData', JSON.stringify(newArticles));
} 