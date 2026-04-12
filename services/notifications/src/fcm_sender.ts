import { GoogleAuth } from 'google-auth-library';

export class FCMSender {
  private auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/firebase.messaging']
  });

  private async getAccessToken(): Promise<string> {
    const client = await this.auth.getClient();
    const token = await client.getAccessToken();
    if (!token.token) {
        throw new Error('Failed to retrieve access token via application default credentials');
    }
    return token.token;
  }

  async sendMessage(message: any): Promise<any> {
    const projectId = process.env.PROJECT_ID || 'smart-venue-dev';
    const accessToken = await this.getAccessToken();
    const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message })
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`FCM V1 API request failed with status ${response.status}: ${err}`);
    }

    return await response.json();
  }
}
