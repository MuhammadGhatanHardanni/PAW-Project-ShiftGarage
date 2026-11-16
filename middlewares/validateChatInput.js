/**
 * middlewares/validateChatInput.js
 * Middleware validasi input untuk endpoint chat AI Assistant.
 * Memastikan pesan pengguna tidak kosong, memiliki tipe string, dan berada dalam batas panjang yang wajar.
 *
 * Tugas PAW — Integrasi Generative AI menggunakan Gemini
 * Mahasiswa: Muhammad Ghatan Hardanni - 20240140182
 */

function validateChatInput(req, res, next) {
  const { message } = req.body;

  // 1. Validasi keberadaan field message
  if (message === undefined || message === null) {
    return res.status(400).json({
      success: false,
      pesan: 'Field "message" wajib disertakan pada body request.',
    });
  }

  // 2. Validasi tipe data harus berupa string
  if (typeof message !== 'string') {
    return res.status(400).json({
      success: false,
      pesan: 'Pesan harus berupa teks (string).',
    });
  }

  const trimmedMessage = message.trim();

  // 3. Validasi pesan tidak boleh kosong atau hanya spasi
  if (trimmedMessage.length === 0) {
    return res.status(400).json({
      success: false,
      pesan: 'Pesan tidak boleh kosong.',
    });
  }

  // 4. Validasi batas minimum panjang pesan (minimal 2 karakter)
  if (trimmedMessage.length < 2) {
    return res.status(400).json({
      success: false,
      pesan: 'Pesan terlalu pendek. Minimal berisi 2 karakter.',
    });
  }

  // 5. Validasi batas maksimum panjang pesan (maksimal 500 karakter untuk mencegah spam/abuse)
  if (trimmedMessage.length > 500) {
    return res.status(400).json({
      success: false,
      pesan: 'Pesan terlalu panjang. Maksimal 500 karakter.',
    });
  }

  // Simpan pesan yang sudah dibersihkan ke request body
  req.body.message = trimmedMessage;
  next();
}

module.exports = validateChatInput;

