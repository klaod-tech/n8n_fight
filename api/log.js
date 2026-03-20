const { MongoClient } = require('mongodb');

module.exports = async (req, res) => {
  // POST 요청만 허용
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Vercel 환경 변수에서 MongoDB 주소를 가져옵니다.
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    return res.status(500).json({ error: 'MONGODB_URI is not defined' });
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db('Shopping');
    const collection = db.collection('logs');

    // n8n에서 보내올 winner, battle_time 데이터
    const { winner, battle_time } = req.body;

    const result = await collection.insertOne({
      winner: winner || "Unknown",
      battle_time: battle_time || "Unknown",
      createdAt: new Date()
    });

    return res.status(200).json({ success: true, id: result.insertedId });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  } finally {
    await client.close();
  }
};
