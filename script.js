// Mobile Menu Controller
class MobileMenu {
  constructor() {
    this.domRef = {
      toggle: document.querySelector('.menu-toggle'),
      navList: document.querySelector('.nav-list'),
      body: document.body
    };
    this.init();
  }

  init() {
    this.addEventListeners();
  }

  addEventListeners() {
    const { toggle } = this.domRef;
    toggle.addEventListener('click', (e) => this.toggleMenu(e));
    document.addEventListener('click', (e) => this.handleOutsideClick(e));
    window.addEventListener('resize', () => this.handleResize());
  }

  toggleMenu(e) {
    e.stopPropagation();
    const { navList, body, toggle } = this.domRef;
    const isOpen = navList.classList.toggle('active');
    
    // Accessibility updates
    toggle.setAttribute('aria-expanded', isOpen);
    body.style.overflow = isOpen ? 'hidden' : 'auto';
  }

  handleOutsideClick(e) {
    const { navList, toggle } = this.domRef;
    if (!e.target.closest('.nav') && !e.target.closest('.menu-toggle')) {
      this.closeMenu();
    }
  }

  handleResize() {
    if (window.innerWidth > 768) this.closeMenu();
  }

  closeMenu() {
    const { navList, body, toggle } = this.domRef;
    navList.classList.remove('active');
    toggle.classList.remove('active');
    toggle.setAttribute('aria-expanded', 'false');
    body.style.overflow = 'auto';
  }
}

// News Service with Advanced Caching
class NewsService {
  static config = {
    API_KEY: '8d7d2bf84f368daed9c6f69dc7e5ad7c',
    ENDPOINT: 'https://gnews.io/api/v4/top-headlines',
    CACHE_TTL: 300000,
    RETRY: { count: 3, delay: 1000 },
    PAGE_SIZE: 10,
    FALLBACK_IMAGE: 'placeholder.jpg'
  };

  constructor() {
    this.cache = new Map();
    this.state = {
      currentCategory: 'general',
      pendingRequests: new Map()
    };
  }

  async fetchNews(category) {
    const cacheKey = `${category}_${Math.floor(Date.now() / NewsService.config.CACHE_TTL)}`;
    
    // Cache-first with revalidation
    if (this.cache.has(cacheKey)) {
      const { data, timestamp } = this.cache.get(cacheKey);
      if (Date.now() - timestamp < NewsService.config.CACHE_TTL) return data;
      this.cache.delete(cacheKey);
    }

    // Request deduplication
    if (this.state.pendingRequests.has(cacheKey)) {
      return this.state.pendingRequests.get(cacheKey);
    }

    const controller = new AbortController();
    try {
      const promise = this._fetchData(category, controller.signal);
      this.state.pendingRequests.set(cacheKey, promise);
      
      const data = await promise;
      if (!data?.articles?.length) throw new Error('No articles found');
      
      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } finally {
      this.state.pendingRequests.delete(cacheKey);
    }
  }

  async _fetchData(category, signal) {
    const params = new URLSearchParams({
      category,
      country: 'in',
      lang: 'hi',
      token: NewsService.config.API_KEY,
      max: NewsService.config.PAGE_SIZE,
      sortBy: 'publishedAt'
    });

    for (let attempt = 1; attempt <= NewsService.config.RETRY.count; attempt++) {
      try {
        const response = await fetch(`${NewsService.config.ENDPOINT}?${params}`, {
          signal,
          headers: { 'User-Agent': 'ChandraBharat/1.0' }
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
      } catch (error) {
        if (attempt === NewsService.config.RETRY.count || error.name === 'AbortError') throw error;
        await new Promise(r => setTimeout(r, NewsService.config.RETRY.delay * attempt));
      }
    }
  }
}

// UI Manager with Virtual DOM Techniques
class UIManager {
  constructor() {
    this.elements = {
      newsContainer: document.getElementById('news-container'),
      featuredSection: document.querySelector('.featured-news'),
      categoryTitle: document.getElementById('category-title'),
      navLinks: document.querySelectorAll('.nav-link')
    };
  }

  async updateInterface(data, category) {
    try {
      this.showLoadingState();
      this.updateNavigationState(category);

      if (!data?.articles?.length) return this.showEmptyState();
      
      const [featured, ...articles] = data.articles;
      this.renderFeaturedArticle(featured);
      this.renderArticleGrid(articles);
    } catch (error) {
      this.showErrorState(error.message);
    }
  }

  renderFeaturedArticle(article) {
    if (!article) return;
    
    this.elements.featuredSection.innerHTML = this._createFeaturedMarkup(article);
  }

  renderArticleGrid(articles) {
    this.elements.newsContainer.innerHTML = articles.length 
      ? articles.map(article => this._createArticleMarkup(article)).join('')
      : this._createEmptyStateMarkup();
  }

  _createFeaturedMarkup(article) {
    return `
      <div class="featured-card">
        <div class="featured-content">
          ${this._metaMarkup(article)}
          <h2>${this.sanitize(article.title)}</h2>
          <p>${this.sanitize(article.description || 'विवरण के लिए पूरा लेख पढ़ें')}</p>
          ${this._linkMarkup(article.url)}
        </div>
        <div class="featured-media">
          <img src="${this.sanitize(article.image || NewsService.config.FALLBACK_IMAGE)}" 
               alt="${this.sanitize(article.title)}" 
               loading="eager"
               class="featured-image"
               onerror="this.src='${NewsService.config.FALLBACK_IMAGE}'">
        </div>
      </div>`;
  }

  _createArticleMarkup(article) {
    return `
      <article class="news-card">
        <div class="news-image">
          <img src="${this.sanitize(article.image || NewsService.config.FALLBACK_IMAGE)}" 
               alt="${this.sanitize(article.title)}" 
               loading="lazy"
               onerror="this.src='${NewsService.config.FALLBACK_IMAGE}'">
        </div>
        <div class="news-content">
          <h3>${this.sanitize(article.title)}</h3>
          <p>${this.sanitize(article.description || '')}</p>
          ${this._metaMarkup(article)}
          ${this._linkMarkup(article.url)}
        </div>
      </article>`;
  }

  _metaMarkup(article) {
    return `
      <div class="article-meta">
        <span class="source">${this.sanitize(article.source?.name || 'अज्ञात स्रोत')}</span>
        <time datetime="${article.publishedAt}">
          ${new Date(article.publishedAt).toLocaleDateString('hi-IN')}
        </time>
      </div>`;
  }

  _linkMarkup(url) {
    return `
      <a href="${this.sanitize(url)}" 
         target="_blank" 
         rel="noopener noreferrer" 
         class="read-more">
        अधिक पढ़ें →
      </a>`;
  }

  showLoadingState() {
    this.elements.newsContainer.innerHTML = `
      <div class="loading-state" aria-live="polite">
        <div class="spinner"></div>
        <p>समाचार लोड हो रहे हैं...</p>
      </div>`;
  }

  showEmptyState() {
    this.elements.newsContainer.innerHTML = `
      <div class="empty-state" aria-live="polite">
        <p>📰 वर्तमान में कोई समाचार उपलब्ध नहीं है</p>
      </div>`;
  }

  showErrorState(message) {
    this.elements.newsContainer.innerHTML = `
      <div class="error-state" aria-live="assertive">
        <p>⚠️ ${this.sanitize(message)}</p>
        <button onclick="window.location.reload()">पुनः प्रयास करें</button>
      </div>`;
  }

  updateNavigationState(category) {
    this.elements.navLinks.forEach(link => {
      const isActive = link.dataset.category === category;
      link.classList.toggle('active', isActive);
      link.setAttribute('aria-current', isActive ? 'page' : 'false');
    });
    this.elements.categoryTitle.textContent = `${category} समाचार`;
  }

  sanitize(str) {
    return str ? str.replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';
  }
}

// Language Controller
class LanguageController {
  constructor() {
    this.buttons = document.querySelectorAll('.lang-btn');
    this.init();
  }

  init() {
    this.buttons.forEach(btn => {
      btn.addEventListener('click', (e) => this.handleLanguageChange(e));
    });
  }

  handleLanguageChange(e) {
    const target = e.target;
    if (target.classList.contains('active')) return;

    this.buttons.forEach(btn => {
      btn.classList.remove('active');
      btn.setAttribute('aria-checked', 'false');
    });

    target.classList.add('active');
    target.setAttribute('aria-checked', 'true');
    document.documentElement.lang = target.dataset.lang;
    // Add content translation logic here
  }
}

// Application Bootstrap
document.addEventListener('DOMContentLoaded', () => {
  try {
    const modules = {
      menu: new MobileMenu(),
      news: new NewsService(),
      ui: new UIManager(),
      lang: new LanguageController()
    };

    // Event Delegation for Navigation
    document.querySelector('.nav-list').addEventListener('click', async (e) => {
      const link = e.target.closest('.nav-link');
      if (!link) return;

      e.preventDefault();
      const category = link.dataset.category;
      try {
        const data = await modules.news.fetchNews(category);
        modules.ui.updateInterface(data, category);
      } catch (error) {
        modules.ui.showErrorState(error.message);
      }
    });

    // Auto-Refresh Mechanism
    let refreshTimer;
    const refreshNews = async () => {
      if (document.hidden) return;
      try {
        const data = await modules.news.fetchNews(modules.news.state.currentCategory);
        modules.ui.updateInterface(data, modules.news.state.currentCategory);
      } catch (error) {
        console.error('Auto-refresh failed:', error);
      }
      refreshTimer = setTimeout(refreshNews, 300000);
    };

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        clearTimeout(refreshTimer);
      } else {
        refreshNews();
      }
    });

    // Initial Load
    modules.news.fetchNews('general')
      .then(data => modules.ui.updateInterface(data, 'general'))
      .catch(error => modules.ui.showErrorState(error.message));

  } catch (error) {
    document.body.innerHTML = `
      <div class="fatal-error">
        <h2>⚠️ एप्लिकेशन त्रुटि</h2>
        <p>कृपया पेज को रीलोड करें</p>
        <button onclick="window.location.reload()">रीलोड करें</button>
      </div>`;
  }
});
