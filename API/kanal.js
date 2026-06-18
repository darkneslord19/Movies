const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const dataPath = path.join(__dirname, '../data/channels.json');

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // URL'den kanal adını al
  const urlParts = req.url.split('?');
  const pathName = urlParts[0];
  const channelName = pathName.replace('/', '').trim() || req.query.kanal;

  if (!channelName) {
    return res.status(400).json({ error: 'Kanal adı gerekli' });
  }

  let channels;
  try {
    const raw = fs.readFileSync(dataPath, 'utf8');
    channels = JSON.parse(raw);
  } catch (error) {
    console.error('Veri okuma hatası:', error);
    return res.status(500).json({ error: 'Veri okuma hatası' });
  }

  if (!channels[channelName]) {
    return res.status(404).json({ error: 'Kanal bulunamadı' });
  }

  const targetUrl = channels[channelName].url;

  try {
    const response = await fetch(targetUrl, {
      headers: { 
        'User-Agent': 'VLC/3.0.18',
        'Accept': '*/*'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    let m3uContent = await response.text();

    // TS segmentlerini proxyle
    const baseUrl = `${req.protocol || 'https'}://${req.headers.host}/api/ts?url=`;
    m3uContent = m3uContent.replace(/(https?:\/\/[^\s"']+\.ts[^\s"']*)/gi, (match) => {
      return baseUrl + encodeURIComponent(match);
    });

    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    res.setHeader('Cache-Control', 'no-cache');
    res.status(200).send(m3uContent);

  } catch (error) {
    console.error('Proxy hatası:', error);
    res.status(500).json({ error: 'Proxy hatası: ' + error.message });
  }
};
