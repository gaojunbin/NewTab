import express from 'express';

export const searchRouter = express.Router();

// Search suggestions
searchRouter.get('/suggest', async (req, res) => {
  const { q, engine = 'google' } = req.query;

  if (!q || q.length < 2) {
    return res.json({ suggestions: [] });
  }

  try {
    let suggestions = [];

    if (engine === 'google') {
      // Google suggestions API
      const response = await fetch(
        `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(q)}`
      );
      const data = await response.json();
      suggestions = data[1] || [];
    } else if (engine === 'youtube') {
      // YouTube uses Google suggestions with "youtube" context
      const response = await fetch(
        `https://suggestqueries.google.com/complete/search?client=youtube&ds=yt&q=${encodeURIComponent(q)}`
      );
      const text = await response.text();
      // Parse JSONP response
      const match = text.match(/\[.*\]/);
      if (match) {
        const data = JSON.parse(match[0]);
        suggestions = (data[1] || []).map(item => item[0]);
      }
    } else if (engine === 'github') {
      // GitHub doesn't have suggestion API, use Google with "github" prefix
      const response = await fetch(
        `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent('github ' + q)}`
      );
      const data = await response.json();
      // Remove "github " prefix from suggestions
      suggestions = (data[1] || []).map(s => s.replace(/^github\s+/i, ''));
    }

    res.json({ suggestions: suggestions.slice(0, 10) });
  } catch (err) {
    // Return empty on error
    res.json({ suggestions: [] });
  }
});
