const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../data/channels.json');

function readData() {
  try {
    if (!fs.existsSync(dataPath)) {
      fs.writeFileSync(dataPath, JSON.stringify({}, null, 2));
      return {};
    }
    const raw = fs.readFileSync(dataPath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    console.error('Read error:', error);
    return {};
  }
}

function writeData(data) {
  try {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Write error:', error);
    return false;
  }
}

module.exports = async (req, res) => {
  console.log('📥 Admin API:', req.method, req.url);
  
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    console.log('✅ OPTIONS');
    return res.status(200).end();
  }

  // ======= TOKEN KONTROLÜ - 3 FARKLI YERDEN DENE =======
  let token = '';
  
  // 1. Authorization header'dan dene
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (authHeader) {
    token = authHeader;
  }
  
  // 2. Query parameter'den dene
  if (!token && req.query.token) {
    token = req.query.token;
  }
  
  // 3. Body'den dene (POST/PUT için)
  if (!token && req.body && req.body.token) {
    token = req.body.token;
  }

  console.log('🔑 Token:', token);
  console.log('📋 Auth Header:', authHeader);
  console.log('📋 Query:', req.query);

  // Token kontrolü - "admin" ile karşılaştır
  if (token !== 'admin') {
    console.log('❌ Token geçersiz!');
    return res.status(401).json({ 
      error: 'Yetkisiz erişim',
      message: 'Token "admin" olmalıdır',
      received: token || '(boş)'
    });
  }

  console.log('✅ Token doğrulandı');

  const channels = readData();
  console.log('📦 Kanal sayısı:', Object.keys(channels).length);

  // GET
  if (req.method === 'GET') {
    console.log('📤 GET');
    return res.status(200).json(channels);
  }

  // POST
  if (req.method === 'POST') {
    const { id, url, name } = req.body || {};
    console.log('📥 POST:', { id, url, name });
    
    if (!id || !url || !name) {
      return res.status(400).json({ error: 'id, url ve name gerekli' });
    }

    if (channels[id]) {
      return res.status(409).json({ error: 'Bu ID zaten var' });
    }

    channels[id] = { 
      url, 
      name, 
      date: new Date().toISOString().split('T')[0] 
    };
    
    if (writeData(channels)) {
      return res.status(201).json({ 
        success: true,
        message: 'Eklendi', 
        channel: channels[id] 
      });
    }
    return res.status(500).json({ error: 'Veri yazma hatası' });
  }

  // PUT
  if (req.method === 'PUT') {
    const { id, url, name } = req.body || {};
    console.log('📥 PUT:', { id, url, name });

    if (!id) {
      return res.status(400).json({ error: 'id gerekli' });
    }

    if (!channels[id]) {
      return res.status(404).json({ error: 'Kanal bulunamadı' });
    }

    if (url) channels[id].url = url;
    if (name) channels[id].name = name;
    channels[id].date = new Date().toISOString().split('T')[0];
    
    if (writeData(channels)) {
      return res.status(200).json({ 
        success: true,
        message: 'Güncellendi', 
        channel: channels[id] 
      });
    }
    return res.status(500).json({ error: 'Veri yazma hatası' });
  }

  // DELETE
  if (req.method === 'DELETE') {
    const { id } = req.query;
    console.log('📥 DELETE:', id);

    if (!id) {
      return res.status(400).json({ error: 'id gerekli' });
    }

    if (!channels[id]) {
      return res.status(404).json({ error: 'Kanal bulunamadı' });
    }

    delete channels[id];
    
    if (writeData(channels)) {
      return res.status(200).json({ 
        success: true,
        message: 'Silindi' 
      });
    }
    return res.status(500).json({ error: 'Veri yazma hatası' });
  }

  return res.status(405).json({ error: 'Metot izin verilmiyor' });
};
