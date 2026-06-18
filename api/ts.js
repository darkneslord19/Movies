const fetch = require('node-fetch');

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const url = req.query.url;
  
  if (!url) {
    return res.status(400).json({ error: 'URL gerekli' });
  }

  try {
    const decodedUrl = decodeURIComponent(url);
    console.log('Fetching TS:', decodedUrl);
    
    const response = await fetch(decodedUrl, {
      headers: {
        'User-Agent': 'VLC/3.0.18',
        'Accept': '*/*'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const buffer = await response.buffer();
    
    res.setHeader('Content-Type', 'video/mp2t');
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.status(200).send(buffer);
    
  } catch (error) {
    console.error('Segment hatası:', error);
    res.status(500).json({ error: 'Segment hatası: ' + error.message });
  }
};
