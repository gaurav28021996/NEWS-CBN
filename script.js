// config.js
const GN = {
    API_KEY: '8d7d2bf84f368daed9c6f69dc7e5ad7c', // Get from https://gnews.io/
    BASE_URL: 'https://gnews.io/api/v4/',
    COUNTRY: 'in',
    LANG: 'hi',
    PAGE_SIZE: 20,
    DEFAULT_CATEGORY: 'general'
};

// news.js
const NewsApp = {
    init() {
        this.cacheElements();
        this.bindEvents();
        this.loadInitialNews();
    },

    cacheElements() {
        this.$newsContainer = document.getElementById('news-container');
        this.$breakingNews = document.getElementById('breaking-news');
        this.$searchInput = document.getElementById('search-input');
        this.$categoryNav = document.querySelectorAll('[data-category]');
        this.$loader = document.getElementById('loading-spinner');
    },

    bindEvents() {
        // Category navigation
        this.$categoryNav.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleCategoryChange(e.target.dataset.category);
            });
        });

        // Search functionality with debounce
        this.$searchInput.addEventListener('input', this.debounce(() => {
            this.handleSearch(this.$searchInput.value.trim());
        }, 500));

        // Infinite scroll
        window.addEventListener('scroll', this.debounce(() => {
            if (this.isBottom() && !this.isLoading) {
                this.loadMoreNews();
            }
        }, 200));
    },

    async fetchNews(params = {}) {
        try {
            this.showLoader();
            const queryParams = new URLSearchParams({
                apikey: GN.API_KEY,
                lang: GN.LANG,
                country: GN.COUNTRY,
                max: GN.PAGE_SIZE,
                ...params
            }).toString();

            const response = await fetch(`${GN.BASE_URL}top-headlines?${queryParams}`);
            
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            return await response.json();
        } catch (error) {
            this.showError(`खबरें लोड करने में समस्या: ${error.message}`);
            console.error('News fetch error:', error);
            return null;
        } finally {
            this.hideLoader();
        }
    },

    async handleCategoryChange(category) {
        // Update UI
        this.$categoryNav.forEach(link => link.classList.remove('active'));
        document.querySelector(`[data-category="${category}"]`).classList.add('active');
        
        // Fetch news
        const newsData = await this.fetchNews({ category });
        if (newsData) {
            this.displayNews(newsData.articles);
            this.updateBreakingNews(newsData.articles[0]);
            this.currentPage = 1;
        }
    },

    async handleSearch(query) {
        if (query.length < 3) return;
        const newsData = await this.fetchNews({ q: query });
        if (newsData) {
            this.displayNews(newsData.articles);
            this.updateBreakingNews(newsData.articles[0]);
        }
    },

    async loadMoreNews() {
        this.isLoading = true;
        this.currentPage++;
        const newsData = await this.fetchNews({ page: this.currentPage });
        if (newsData) {
            this.displayNews([...this.currentArticles, ...newsData.articles]);
        }
        this.isLoading = false;
    },

    displayNews(articles) {
        if (!articles || articles.length === 0) {
            this.$newsContainer.innerHTML = '<p class="no-results">कोई खबरें उपलब्ध नहीं हैं</p>';
            return;
        }

        this.currentArticles = articles;
        const newsHTML = articles.map(article => `
            <article class="news-card">
                <div class="image-container">
                    <img src="${article.image || 'placeholder.jpg'}" 
                         alt="${article.title}"
                         class="news-image"
                         onerror="this.src='placeholder.jpg'">
                    <span class="news-source">${article.source.name}</span>
                </div>
                <div class="news-content">
                    <h3 class="news-title">${article.title}</h3>
                    <p class="news-description">${article.description || ''}</p>
                    <div class="news-meta">
                        <time>${this.formatDate(article.publishedAt)}</time>
                        <a href="${article.url}" target="_blank" class="read-more">
                            पढ़ें पूरी खबर
                            <span class="arrow">→</span>
                        </a>
                    </div>
                </div>
            </article>
        `).join('');

        this.$newsContainer.innerHTML = newsHTML;
        this.animateCards();
    },

    updateBreakingNews(article) {
        if (!article) return;
        this.$breakingNews.innerHTML = `
            <span class="breaking-tag">ताज़ा खबर:</span>
            ${article.title}
            <a href="${article.url}" target="_blank" class="breaking-link">
                विवरण पढ़ें
            </a>
        `;
    },

    // Helper functions
    debounce(fn, delay) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => fn.apply(this, args), delay);
        };
    },

    formatDate(dateString) {
        const options = { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return new Date(dateString).toLocaleDateString('hi-IN', options);
    },

    isBottom() {
        return window.innerHeight + window.scrollY >= document.body.offsetHeight - 500;
    },

    animateCards() {
        const cards = document.querySelectorAll('.news-card');
        cards.forEach((card, index) => {
            setTimeout(() => {
                card.style.opacity = 1;
                card.style.transform = 'translateY(0)';
            }, index * 100);
        });
    },

    showLoader() {
        this.$loader.style.display = 'block';
    },

    hideLoader() {
        this.$loader.style.display = 'none';
    },

    showError(message) {
        const errorHTML = `
            <div class="error-message">
                ⚠️ ${message}
                <button onclick="NewsApp.loadInitialNews()">पुनः प्रयास करें</button>
            </div>
        `;
        this.$newsContainer.innerHTML = errorHTML;
    },

    loadInitialNews() {
        this.handleCategoryChange(GN.DEFAULT_CATEGORY);
    }
};

// Initialize the app
document.addEventListener('DOMContentLoaded', () => NewsApp.init());
