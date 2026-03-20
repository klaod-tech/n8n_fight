import { InteractionType, InteractionResponseType, verifyKey } from 'discord-interactions';

export default async function handler(req, res) {
  const signature = req.headers['x-signature-ed25519'];
  const timestamp = req.headers['x-signature-timestamp'];
  const rawBody = await req.text();

  // 1. 디스코드 보안 검증
  const isValidRequest = verifyKey(rawBody, signature, timestamp, process.env.DISCORD_PUBLIC_KEY);
  if (!isValidRequest) {
    return res.status(401).send('Bad request signature');
  }

  const interaction = JSON.parse(rawBody);

  // 2. 디스코드의 'PING' 테스트에 'PONG'으로 응답 (이게 통과 비결입니다)
  if (interaction.type === InteractionType.PING) {
    return res.send({ type: InteractionResponseType.PONG });
  }

  // 3. 실제 명령어 신호는 n8n 터널 주소로 전달 (Proxy)
  const n8nResponse = await fetch(process.env.N8N_WEBHOOK_URL, {
    method: 'POST',
    body: rawBody,
    headers: { 'Content-Type': 'application/json' }
  });

  const data = await n8nResponse.json();
  res.send(data);
}
