export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { messages = [], system = '' } = req.body;

  // 1. Prova GROQ
  try {
    const groqMessages = [];
    if (system) groqMessages.push({ role: 'system', content: system });
    messages.forEach(m => groqMessages.push({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }));

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: groqMessages, max_tokens: 800, temperature: 0.7 })
    });

    if (groqRes.ok) {
      const data = await groqRes.json();
      const reply = data.choices?.[0]?.message?.content;
      if (reply) return res.status(200).json({ reply });
    }
    console.log('Groq failed, trying Gemini...');
  } catch (e) { console.log('Groq error:', e.message); }

  // 2. Prova GEMINI
  try {
    const contents = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));
    const requestBody = { contents, generationConfig: { maxOutputTokens: 800, temperature: 0.7 } };
    if (system) requestBody.system_instruction = { parts: [{ text: system }] };

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${process.env.GEMINI_API_KEY}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody) }
    );

    if (geminiRes.ok) {
      const data = await geminiRes.json();
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (reply) return res.status(200).json({ reply });
    }
    console.log('Gemini failed, trying Mistral...');
  } catch (e) { console.log('Gemini error:', e.message); }

  // 3. Prova MISTRAL
  try {
    const mistralMessages = [];
    if (system) mistralMessages.push({ role: 'system', content: system });
    messages.forEach(m => mistralMessages.push({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }));

    const mistralRes = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}` },
      body: JSON.stringify({ model: 'mistral-small-latest', messages: mistralMessages, max_tokens: 800, temperature: 0.7 })
    });

    if (mistralRes.ok) {
      const data = await mistralRes.json();
      const reply = data.choices?.[0]?.message?.content;
      if (reply) return res.status(200).json({ reply });
    }
  } catch (e) { console.log('Mistral error:', e.message); }

  // Tutti falliti
  return res.status(200).json({ reply: 'Non ho questa info, contatta Leonardo direttamente: leonardofaulisi97@gmail.com' });
} 
