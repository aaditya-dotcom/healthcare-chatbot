# 🩺 MediCure AI — Intelligent Medical Chatbot & Health Consultation Assistant

An empathetic, clinical-grade medical AI consultation platform and symptom triage assistant powered by **OpenAI** (`GPT-4o` & `GPT-4o-mini`). Built with pure Vanilla HTML5, modern CSS3, Node.js & Express.

![MediCure AI Preview Banner](https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80)

---

## ✨ Key Features

- 🤖 **OpenAI GPT-4o / GPT-4o-mini Integration**: Real-time streaming consultation with medical system prompt engineering following evidence-based clinical triage guidelines.
- 🩺 **Structured Symptom Triage Form**: Guided clinical checkup modal (Age, Biological Sex, Primary Symptoms, Duration, Pain/Severity slider 1-10, Medical history).
- 💊 **Medication Intelligence Guide**: Fast queries for drug usages, standard dosage precautions, food-drug interactions, and side effects.
- 🥗 **Diet & Preventive Wellness Advisor**: Tailored nutritional guidance for chronic conditions (Hypertension, Diabetes, GERD, etc.).
- 🎙️ **Voice Consultation (Speech-to-Text)**: Speak symptoms hands-free using Web Speech API.
- 🔊 **Audio Playback (Text-to-Speech)**: Listen to recommendations with natural speech synthesis.
- 🚨 **Emergency SOS Directory & Red Flag Alerts**: Dedicated quick access to emergency hotlines (India 112/108, US 911/988, UK 999/111).
- 📄 **Consultation Export**: Download session transcripts as clean clinical reports.
- 🌗 **Dark / Light Mode**: Seamless theme switching with persistent preferences.
- 🛡️ **Interactive Preview Demo Engine**: Test the UI and clinical response flows even before an OpenAI API key is supplied!

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- An [OpenAI API Key](https://platform.openai.com/api-keys)

### 2. Installation
Clone the repository and install dependencies:
```bash
git clone <your-repo-url>
cd medicure-ai
npm install
```

### 3. Configure Your OpenAI API Key
Create a `.env` file from `.env.example`:
```bash
cp .env.example .env
```
Open `.env` and add your secret key:
```env
OPENAI_API_KEY=sk-proj-your-openai-api-key-here
PORT=3000
OPENAI_MODEL=gpt-4o-mini
```

*(Alternatively, you can start the application and enter your key directly inside the **Settings** modal in the top navigation bar!)*

### 4. Run the Application
```bash
npm start
```
Or for auto-reloading during development:
```bash
npm run dev
```

Open your browser and navigate to:
```
http://localhost:3000
```

---

## 📂 Project Architecture

```
├── public/
│   ├── index.html        # Semantic HTML5 clinical UI layout & modals
│   ├── css/
│   │   └── style.css     # Tailored medical design system, animations & responsive grid
│   └── js/
│       └── app.js        # Frontend controller (streaming, speech, triage, history)
├── .env.example          # Template for environment configuration
├── .gitignore            # Git exclusion rules (protects API keys & node_modules)
├── package.json          # Project dependencies & scripts
├── server.js             # Express backend with SSE streaming & OpenAI API handler
└── README.md             # Complete documentation & Git setup instructions
```

---

## 📤 Pushing to Git & GitHub

Follow these steps to initialize and push this project to your GitHub account:

### 1. Initialize Git & Create Initial Commit
```bash
git init
git add .
git commit -m "feat: Initial commit for MediCure AI Medical Chatbot"
```

### 2. Link with your Remote GitHub Repository
Go to [GitHub](https://github.com/new) and create a new repository (e.g. `medical-chatbot`). Then run:
```bash
git branch -M main
git remote add origin https://github.com/<YOUR-USERNAME>/<YOUR-REPOSITORY-NAME>.git
git push -u origin main
```

> **Security Note:** The `.gitignore` file already prevents your `.env` file and API keys from ever being committed or exposed on Git.

---

## ⚖️ Clinical & Legal Disclaimer

*MediCure AI is designed for informational and educational triage purposes only. It is not a certified diagnostic device and does not substitute for professional medical advice, diagnosis, or clinical treatment from a licensed physician. If you are experiencing a life-threatening medical emergency, call your local emergency services (112, 911, 108, or 999) immediately.*

---

## 📄 License
This project is open-source under the [MIT License](LICENSE).
