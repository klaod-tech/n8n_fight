const { MongoClient, ServerApiVersion } = require('mongodb');

module.exports = async (req, res) => {
  // 1. POST 요청이 아니면 거절 (보안)
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 2. Vercel 환경변수에서 주소를 가져옵니다. 
  // (아까 Vercel 설정창에 넣으신 MONGODB_URI를 읽어옵니다)
  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    return res.status(500).json({ error: 'MONGODB_URI 환경변수가 설정되지 않았습니다.' });
  }

  // 3. MongoDB 클라이언트 설정
  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });

  try {
    await client.connect();
    const db = client.db('Shopping'); // 데이터베이스 이름
    const collection = db.collection('logs'); // 컬렉션 이름

    // 4. n8n에서 보낸 데이터를 받습니다.
    const { winner, battle_time } = req.body;

    // 5. 실제 데이터 저장 실행
    const result = await collection.insertOne({
      winner: winner || "이름 없음",
      battle_time: battle_time || "시간 정보 없음",
      createdAt: new Date()
    });

    // 6. 성공 결과 반환
    return res.status(200).json({ 
      success: true, 
      message: "데이터 저장 성공!",
      id: result.insertedId 
    });

  } catch (error) {
    console.error("MongoDB 에러:", error);
    return res.status(500).json({ success: false, error: error.message });
  } finally {
    // 7. 연결 종료
    await client.close();
  }
};
