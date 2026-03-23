exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  try {
    const body = JSON.parse(event.body);
    const messages = body.messages || [];
    const system = body.system || '';
    const contents = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));
    const requestBody = {
      contents: contents,
      generationConfig: { maxOutputTokens: 300, temperature: 0.7 }
    };
    if (system) {
      requestBody.system_instruction = { parts: [{ text: system }] };
    }
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${process.env.GEMINI_API_KEY}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody) }
    );
    const data = await response.json();
    console.log('Status:', response.status);
    if (!response.ok) throw new Error(`Gemini error: ${JSON.stringify(data)}`);
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Non ho questa info, contatta Leonardo: leonardofaulisi97@gmail.com';
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply: text })
    };
  } catch (error) {
    console.log('Error:', error.message);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
