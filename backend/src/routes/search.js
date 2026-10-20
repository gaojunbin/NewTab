import express from 'express';

export const searchRouter = express.Router();

async function fetchWithTimeout(url, timeoutMs = 2500) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// Search suggestions
searchRouter.get('/suggest', async (req, res) => {
  const { q, engine = 'google' } = req.query;

  if (!q || String(q).length < 2) {
    return res.json({ suggestions: [] });
  }

  const query = String(q);

  try {
    let suggestions = [];

    if (engine === 'google') {
      const response = await fetchWithTimeout(
        `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(query)}`
      );
      const data = await response.json();
      suggestions = data[1] || [];
    } else if (engine === 'bing') {
      const response = await fetchWithTimeout(
        `https://api.bing.com/osjson.aspx?query=${encodeURIComponent(query)}`
      );
      const data = await response.json();
      suggestions = data[1] || [];
    } else if (engine === 'baidu') {
      const response = await fetchWithTimeout(
        `https://suggestion.baidu.com/su?wd=${encodeURIComponent(query)}&action=opensearch`
      );
      const buffer = await response.arrayBuffer();
      const decoder = new TextDecoder('gbk');
      const text = decoder.decode(buffer);
      const data = JSON.parse(text);
      suggestions = data[1] || [];
    } else if (engine === 'youtube') {
      const response = await fetchWithTimeout(
        `https://suggestqueries.google.com/complete/search?client=youtube&ds=yt&q=${encodeURIComponent(query)}`
      );
      const text = await response.text();
      const match = text.match(/\[.*\]/);
      if (match) {
        const data = JSON.parse(match[0]);
        suggestions = (data[1] || []).map(item => item[0]);
      }
    } else if (engine === 'github') {
      const response = await fetchWithTimeout(
        `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent('github ' + query)}`
      );
      const data = await response.json();
      suggestions = (data[1] || []).map(s => s.replace(/^github\s+/i, ''));
    } else {
      const response = await fetchWithTimeout(
        `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(query)}`
      );
      const data = await response.json();
      suggestions = data[1] || [];
    }

    res.json({ suggestions: suggestions.slice(0, 8) });
  } catch {
    res.json({ suggestions: [] });
  }
});
