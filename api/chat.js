export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const body = req.body;
    const messages = body.messages || [];
    const system = body.system || '';

    const contents = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const requestBody = {
      contents: contents,
      generationConfig: { maxOutputTokens: 800, temperature: 0.7, topP: 0.9 }
    };

    if (system) {
      requestBody.system_instruction = {
        parts: [{ text: system }]
      };
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      }
    );

    const data = await response.json();
    console.log('Status:', response.status);

    if (!response.ok) {
      throw new Error(`Gemini error: ${JSON.stringify(data)}`);
    }

    const text =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      'Non ho questa info, contatta Leonardo: leonardofaulisi97@gmail.com';

    res.status(200).json({ reply: text });

  } catch (error) {
    console.log('Error:', error.message);
    res.status(500).json({ error: error.message });
  }
}
