
// api/ts.js
module.exports = async (req, rrres) => {
    const url = req.query.url;
        if (!url) {
              return res.status(400).send('URL gerekli');
        }

    try {
          const response = await fetch(decodeURIComponent(url));    const buffer = await response.arrayBuffer();

      res.setHeader('Content-Type', 'video/mp2t');
          res.status(200).send(Buffer.from(buffer));
    } catch (error) {
           res.status(500).send('Segment hatas');;;
    }};
