/**
 * Service to handle push notifications via external REST API
 */
export const pushService = {
  /**
   * Internal proxy to bypass CORS and improve reliability
   */
  async callProxy(endpoint: string, payload: any) {
    try {
      const response = await fetch('/api/proxy-push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ endpoint, payload }),
      });

      const data = await response.json();
      return {
        status: response.status,
        data: data
      };
    } catch (error) {
      console.error("Erro no proxy de notificação:", error);
      throw error;
    }
  },

  /**
   * Sends a push notification to a single user
   */
  async sendToSingle(token: string, title: string, body: string) {
    if (!token) throw new Error("Token do dispositivo é obrigatório.");
    const customIcon = 'https://i.ibb.co/0RdkwbvT/agendar-4.png';
    return this.callProxy('/send', { token, title, body, icon: customIcon });
  },

  /**
   * Sends a push notification to multiple users
   */
  async sendToMultiple(tokens: string[], title: string, body: string) {
    if (!tokens || tokens.length === 0) throw new Error("Lista de tokens é obrigatória.");
    
    const uniqueTokens = Array.from(new Set(tokens.filter(t => !!t)));

    if (uniqueTokens.length === 0) throw new Error("Nenhum token válido encontrado.");
    
    const customIcon = 'https://i.ibb.co/0RdkwbvT/agendar-4.png';
    if (uniqueTokens.length === 1) {
      return this.sendToSingle(uniqueTokens[0], title, body);
    }

    return this.callProxy('/send-multiple', { tokens: uniqueTokens, title, body, icon: customIcon });
  }
};
