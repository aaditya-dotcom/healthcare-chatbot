import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Clinical Medical System Prompt
const MEDICAL_SYSTEM_PROMPT = `You are MediCure AI, a professional, empathetic, and safety-first virtual medical consultant and triage assistant.

CRITICAL CLINICAL & COMMUNICATION GUIDELINES:
1. EMPATHY & CLARITY: Greet the user with warmth, acknowledge their distress or symptom, and explain things in clear, plain language (avoid unhelpful medical jargon without explanation).
2. STRUCTURED RESPONSE:
   - 🩺 **Clinical Overview**: Acknowledge symptoms and summarize what might be happening.
   - 💡 **Potential Health Considerations**: Suggest possible educational causes/differentials (state clearly that these are possibilities, not a formal diagnosis).
   - 🛡️ **Home Care & Practical Measures**: Evidence-based self-care, rest, hydration, positioning, dietary adjustments, or over-the-counter advice with safe precautions.
   - ⚠️ **Red Flag Signs**: Explicitly list warning symptoms that require immediate emergency room or urgent doctor evaluation.
   - ❓ **Triage Questions**: Ask 1-2 targeted follow-up questions to understand duration, severity (1-10), other symptoms, or preexisting conditions.
   - ⚖️ **Medical Disclaimer**: Conclude with a reminder that this guidance is informational and a licensed healthcare professional should be consulted for diagnosis and treatment.
3. EMERGENCY PROTOCOL: If the user describes acute life-threatening symptoms (e.g., severe crushing chest pain, sudden numbness/paralysis, difficulty breathing, coughing blood, severe allergic reaction/anaphylaxis, poisoning, suicidal ideation), immediately prioritize calling emergency services (112 / 911 / 999) before any other guidance.
4. LANGUAGE ADAPTABILITY: Respond naturally in whatever language or dialect the user uses (English, Hindi, Hinglish, etc.). If asked in Hinglish or Hindi, answer comfortably in empathetic Hinglish or Hindi.
5. NO PRESCRIPTIONS: Never prescribe prescription-only antibiotics, narcotics, or dangerous dosages. Always advise in-person physician verification for pharmaceuticals.`;

// Demo Fallback Triage Generator when OpenAI key is not yet set
function generateDemoResponse(userQuery) {
  const query = (userQuery || '').toLowerCase();
  
  let symptomTopic = 'General Health Consultation';
  let insights = 'It is important to assess symptom duration, severity, and any associated conditions.';
  let remedies = 'Ensure adequate rest, hydrate with water and electrolytes, and monitor for changes.';
  let redFlags = 'High persistent fever, sudden shortness of breath, confusion, or severe worsening pain.';
  
  if (query.includes('fever') || query.includes('bukhar') || query.includes('temperature')) {
    symptomTopic = 'Fever & Temperature Management';
    insights = 'Fever is commonly an immune reaction to viral infections (like flu, common cold) or bacterial illnesses.';
    remedies = 'Stay well-hydrated, apply lukewarm sponge compress on forehead, rest, and keep the room well-ventilated. Paracetamol/Acetaminophen may be used per standard package instructions if appropriate for your age/profile.';
    redFlags = 'Fever > 103°F (39.4°C), fever lasting more than 3 days, stiff neck, rash, or difficulty breathing.';
  } else if (query.includes('headache') || query.includes('sar dard') || query.includes('migraine')) {
    symptomTopic = 'Headache & Migraine Assessment';
    insights = 'Headaches frequently stem from tension, dehydration, screen fatigue, stress, sinus congestion, or migraine.';
    remedies = 'Rest in a quiet, dimly lit room. Drink 500ml of water. Apply gentle neck stretches or cold/warm compress. Limit bright screens.';
    redFlags = 'Sudden "thunderclap" headache (worst of your life), accompanied by vision loss, weakness, confusion, or fever.';
  } else if (query.includes('cough') || query.includes('khasi') || query.includes('throat') || query.includes('gala')) {
    symptomTopic = 'Cough & Throat Irritation';
    insights = 'Throat irritation and cough can be caused by viral upper respiratory infections, post-nasal drip, allergies, or acid reflux.';
    remedies = 'Warm water with honey & lemon, salt water gargles 3 times a day, steam inhalation, and staying away from smoke or cold irritants.';
    redFlags = 'Coughing up blood, wheezing or severe shortness of breath, stridor, or inability to swallow fluids.';
  } else if (query.includes('stomach') || query.includes('pet dard') || query.includes('acidity') || query.includes('gas')) {
    symptomTopic = 'Abdominal Discomfort & Acidity';
    insights = 'Stomach discomfort often relates to indigestion, gastritis, dietary triggers, gastroesophageal reflux, or mild gastroenteritis.';
    remedies = 'Sip warm water, eat light bland food (banana, rice, toast), avoid spicy or oily meals, and avoid lying flat right after eating.';
    redFlags = 'Severe sharp localized abdominal pain (especially lower right side), persistent vomiting, blood in stool, or high fever.';
  }

  return `### 🩺 Clinical Overview (${symptomTopic})
Thank you for reaching out. Based on your description: **"${userQuery}"**, I'm providing an initial clinical triage assessment.

*Note: You are currently viewing this in **Interactive Preview Mode**. To get live, individualized AI consultations with real-time reasoning, please connect your OpenAI API key using the Settings button in the top bar.*

---

### 💡 Potential Health Considerations
- ${insights}
- Symptoms can often be exacerbated by stress, lack of sleep, or dehydration.

---

### 🛡️ Recommended Self-Care & Immediate Measures
1. **Hydration & Rest:** ${remedies}
2. **Monitoring:** Track your temperature or pain score (1 to 10) on a notes app every 4 hours.
3. **Nutrition:** Stick to light, easy-to-digest nutrition and avoid caffeine or alcohol.

---

### ⚠️ Red Flag Symptoms (Seek Urgent Medical Care)
Please visit an emergency room or contact emergency services immediately if you experience:
- ${redFlags}
- Any sudden deterioration in mental alert state or inability to keep fluids down.

---

### ❓ Follow-up Triage Questions
1. How many hours or days have you been experiencing this?
2. Do you have any known medical conditions (e.g., Asthma, Diabetes, Blood Pressure) or current medications?

---
> ⚖️ **Medical Disclaimer:** This information is generated for educational and triage support. It does not constitute formal medical diagnosis or prescription. Always consult a certified healthcare professional.`;
}

// Status check API
app.get('/api/status', (req, res) => {
  const envKey = process.env.OPENAI_API_KEY || '';
  res.json({
    status: 'online',
    hasEnvKey: !!envKey && envKey.trim().length > 5 && !envKey.includes('your_openai_api_key'),
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    version: '1.0.0'
  });
});

// Update API Key in .env
app.post('/api/set-key', (req, res) => {
  const { apiKey } = req.body;
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 10) {
    return res.status(400).json({ error: 'Valid API key is required.' });
  }

  try {
    const envPath = path.join(__dirname, '.env');
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    if (envContent.includes('OPENAI_API_KEY=')) {
      envContent = envContent.replace(/OPENAI_API_KEY=.*/g, `OPENAI_API_KEY=${apiKey.trim()}`);
    } else {
      envContent += `\nOPENAI_API_KEY=${apiKey.trim()}\n`;
    }

    fs.writeFileSync(envPath, envContent, 'utf8');
    process.env.OPENAI_API_KEY = apiKey.trim();

    return res.json({ success: true, message: 'API Key saved successfully to .env' });
  } catch (err) {
    console.error('Failed to write .env:', err);
    return res.status(500).json({ error: 'Could not update .env file on server.' });
  }
});

// Chat completion endpoint (with streaming SSE support)
app.post('/api/chat', async (req, res) => {
  const { messages, apiKey: clientApiKey, model: clientModel, stream = true } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Messages array is required.' });
  }

  const effectiveKey = (clientApiKey && clientApiKey.trim().length > 5) 
    ? clientApiKey.trim() 
    : (process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes('your_openai_api_key') ? process.env.OPENAI_API_KEY.trim() : null);

  const selectedModel = clientModel || process.env.OPENAI_MODEL || 'gpt-4o-mini';

  // If no API key provided anywhere, return demo triage response
  if (!effectiveKey) {
    const lastUserMessage = messages.filter(m => m.role === 'user').pop()?.content || '';
    const demoReply = generateDemoResponse(lastUserMessage);

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      // Simulate streaming chunks
      const words = demoReply.split(' ');
      for (let i = 0; i < words.length; i++) {
        const chunk = (i === 0 ? '' : ' ') + words[i];
        res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
        await new Promise(r => setTimeout(r, 20));
      }
      res.write('data: [DONE]\n\n');
      return res.end();
    } else {
      return res.json({
        role: 'assistant',
        content: demoReply,
        isDemo: true
      });
    }
  }

  try {
    const openai = new OpenAI({ apiKey: effectiveKey });

    const conversationHistory = [
      { role: 'system', content: MEDICAL_SYSTEM_PROMPT },
      ...messages.slice(-10) // keep last 10 messages for context efficiency
    ];

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const completionStream = await openai.chat.completions.create({
        model: selectedModel,
        messages: conversationHistory,
        temperature: 0.3,
        stream: true
      });

      for await (const chunk of completionStream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }

      res.write('data: [DONE]\n\n');
      return res.end();
    } else {
      const completion = await openai.chat.completions.create({
        model: selectedModel,
        messages: conversationHistory,
        temperature: 0.3
      });

      const reply = completion.choices[0]?.message?.content || 'Unable to generate response.';
      return res.json({
        role: 'assistant',
        content: reply,
        isDemo: false
      });
    }
  } catch (err) {
    console.error('OpenAI API Error:', err);
    const errorMessage = err?.message || 'Error communicating with OpenAI service.';
    
    if (stream) {
      res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
      res.write('data: [DONE]\n\n');
      return res.end();
    } else {
      return res.status(500).json({ error: errorMessage });
    }
  }
});

// Fallback route for SPA
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🩺 MediCure AI Medical Chatbot running at http://localhost:${PORT}`);
});
