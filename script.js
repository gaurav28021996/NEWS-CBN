<script>
    const API_KEY = '8d7d2bf84f368daed9c6f69dc7e5ad7c';
    const BASE_URL = 'https://gnews.io/api/v4/top-headlines?country=in&lang=en&apikey=';

    // Mock translation function - replace with real API
    function translateToHindi(text) {
        // In production, use Google Cloud Translation API:
        // https://cloud.google.com/translate/docs/reference/rest
        return {
            'Apple launches new iPhone': 'एप्पल ने लॉन्च किया नया आईफोन',
            'Budget announced by government': 'सरकार ने पेश किया बजट'
        }[text] || 'अनुवाद उपलब्ध नहीं';
    }

    async function loadNews(category = 'general') {
        try {
            const response = await fetch(`${BASE_URL}${API_KEY}&category=${category}`);
            const data = await response.json();
            displayNews(data.articles);
        } catch (error) {
            console.error('Error:', error);
        }
    }

    function displayNews(articles) {
        const newsContainer = document.getElementById('news-container');
        newsContainer.innerHTML = '';

        articles.forEach(article => {
            const newsCard = document.createElement('div');
            newsCard.className = 'news-card';
            newsCard.innerHTML = `
                <img src="${article.image || 'placeholder.jpg'}" class="news-image">
                <div class="news-content">
                    <div class="news-source">${article.source.name}</div>
                    <h3 class="news-title-en">${article.title}</h3>
                    <h4 class="news-title-hi">${translateToHindi(article.title)}</h4>
                    <p class="news-description-en">${article.description || ''}</p>
                    <p class="news-description-hi">${translateToHindi(article.description || '')}</p>
                    <a href="${article.url}" target="_blank" class="read-more">
                        Read More / पूरी खबर पढ़ें
                    </a>
                </div>
            `;
            newsContainer.appendChild(newsCard);
        });
    }
</script>
