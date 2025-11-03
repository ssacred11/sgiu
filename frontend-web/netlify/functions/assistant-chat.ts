// frontend-web/netlify/functions/assistant-chat.ts
import type { Handler } from '@netlify/functions';

const systemInstruction = `
Eres un asistente servicial para la app de gestión de incidencias "SGIU".
Tu propósito es ayudar a los estudiantes y administradores de la universidad.

REGLAS IMPORTANTES:
1. Si te preguntan cómo reportar una incidencia (ej. "un enchufe malo en la sala 309", "baño sucio"), tu respuesta SIEMPRE debe ser:
   "Puedes reportar esa incidencia directamente desde la app móvil de SGIU. Ve a la sección 'Nueva Incidencia', describe el problema (ej. 'enchufe malo sala 309'), y el personal de mantenimiento será notificado."

2. Si te preguntan cómo arreglar algo (ej. "cómo arreglo el enchufe"), por seguridad, tu respuesta SIEMPRE debe ser:
   "No puedo darte instrucciones de reparación por tu seguridad. Por favor, reporta la incidencia en la app móvil de SGIU para que el personal de mantenimiento calificado se encargue."

3. Para otras preguntas generales, sé un asistente amigable y conciso.
`;

type FrontendMessage = {
  role: 'user' | 'assistant';
  content: string;
};

type GeminiMessage = {
  role: 'user' | 'model';
  parts: { text: string }[];
};

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // Esta línea (35) se arregla con: npm install -D @types/node
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY; 
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY no configurada');
    }

    const { messages: frontendMessages } = JSON.parse(event.body || '{}') as { messages: FrontendMessage[] };
    if (!frontendMessages) {
      return { statusCode: 400, body: 'Faltan mensajes' };
    }

    const geminiMessages: GeminiMessage[] = frontendMessages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    const apiRequestBody = {
      contents: [
        { role: 'user', parts: [{ text: systemInstruction }] },
        { role: 'model', parts: [{ text: 'Entendido. Estoy listo para ayudar como asistente de SGIU.' }] },
        ...geminiMessages,
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 1,
        topP: 1,
      },
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiRequestBody),
      }
    );

    if (!response.ok) {
      throw new Error(`Error de Gemini: ${await response.text()}`);
    }

    const data = await response.json();
    const reply = data.candidates[0]?.content?.parts[0]?.text ?? '(sin respuesta de Gemini)';

    return {
      statusCode: 200,
      body: JSON.stringify({ reply: reply }),
      headers: { 'Content-Type': 'application/json' },
    };

  } catch (error) {
    // Esta es la corrección para el error 'unknown'
    const message = (error instanceof Error) ? error.message : String(error);
    
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: message }) 
    };
  }
};