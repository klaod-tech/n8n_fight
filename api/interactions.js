import { InteractionType, InteractionResponseType, verifyKey } from 'discord-interactions';

// Vercel이 본문을 자동으로 파싱하지 않도록 설정 (보안 검증용)
export const config = {
  api: {
    bodyParser: false,
  },
};

// 스트림 데이터를 버퍼로 변환하는 함수
async function getRawBody(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  // GET 요청 시 서버 상태 확인용
  if (req.method === 'GET') return res.status(200).send('Vercel Proxy is Online');

  const signature = req.headers['x-signature-ed25519'];
  const timestamp = req.headers['x-signature-timestamp'];
  
  // 에러가 났던 req.text() 대신 직접 버퍼를 읽어옵니다.
  const rawBody = await getRawBody(req);

  // 1. 디스코드 보안 검증
  const isValidRequest = verifyKey(rawBody, signature, timestamp, process.env.DISCORD_PUBLIC_KEY);
  
  if (!isValidRequest) {
    return res.status(401).send('Bad request signature');
  }

  const interaction = JSON.parse(rawBody.toString());

  // 2. 디스코드 PING 응답 (인증의 핵심)
  if (interaction.type === InteractionType.PING) {
    return res.json({ type: InteractionResponseType.PONG });
  }

  // 3. n8n으로 신호 전달
  try {
    const n8nResponse = await fetch(process.env.N8N_WEBHOOK_URL, {
      method: 'POST',
      body: rawBody.toString(),
      headers: { 'Content-Type': 'application/json' }
    });
    
    const data = await n8nResponse.json();
    return res.json(data);
  } catch (error) {
    return res.json({ type: 4, data: { content: "n8n is standby" } });
  }
}
