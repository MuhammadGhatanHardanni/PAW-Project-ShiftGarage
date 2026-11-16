/**
 * config/gemini.js
 * Konfigurasi integrasi Google Gemini Generative AI (LLM).
 * Membaca API Key dan Model dari environment variable (.env).
 *
 * Tugas PAW — Integrasi Generative AI menggunakan Gemini
 * Mahasiswa: Muhammad Ghatan Hardanni - 20240140182
 */

require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

function getApiKey() {
  return process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : '';
}

function getModelName() {
  const envModel = process.env.GEMINI_MODEL ? process.env.GEMINI_MODEL.trim() : '';
  // Jika masih memakai model lama yang sudah 404 (gemini-1.5-flash / gemini-2.5-flash), alihkan ke gemini-3.5-flash-lite
  if (!envModel || envModel.includes('1.5') || envModel === 'gemini-2.5-flash') {
    return 'gemini-3.5-flash-lite';
  }
  return envModel;
}

let genAI = null;
function getGenAI() {
  const key = getApiKey();
  if (!key || key === 'your_google_gemini_api_key_here') return null;
  if (!genAI) {
    genAI = new GoogleGenerativeAI(key);
  }
  return genAI;
}

module.exports = {
  get apiKey() {
    return getApiKey();
  },
  get modelName() {
    return getModelName();
  },
  // Model prioritas fallback jika satu model mengalami spike 503 / 404
  fallbackModels: ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-flash-latest'],
  /**
   * Memeriksa apakah API Key Gemini telah disetel
   */
  isConfigured() {
    const key = getApiKey();
    return Boolean(key && key !== 'your_google_gemini_api_key_here');
  },
  /**
   * Mendapatkan instance Generative Model dengan opsi konfigurasi
   */
  getModel(systemInstruction = null, targetModel = null) {
    const client = getGenAI();
    if (!client) return null;

    const chosenModel = targetModel || getModelName();
    const options = {
      model: chosenModel,
    };

    if (systemInstruction) {
      options.systemInstruction = systemInstruction;
    }

    return client.getGenerativeModel(options);
  },
};
