export async function sendWelcomeWhatsApp(phone: string, name: string, role: 'creator' | 'student' | 'affiliate') {
  try {
    // Agora o Client-Side (Navegador) delega a responsabilidade para o nosso Backend na Vercel
    // Isso evita bloqueios de CORS e protege nossas chaves de API
    const response = await fetch('/api/whatsapp/welcome', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ phone, name, role })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.error('[Evolution API Client] Falha ao delegar disparo para o Backend:', errData);
    } else {
      console.log(`[Evolution API Client] Solicitação de WhatsApp enviada ao Backend com sucesso para ${phone}`);
    }
  } catch (error) {
    console.error('[Evolution API Client] Erro catastrófico ao delegar disparo:', error);
  }
}
