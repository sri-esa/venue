/**
 * @module fcm_sender
 * @description Firebase Cloud Messaging V1 REST API client.
 * Uses Application Default Credentials (ADC) — no hardcoded service-account
 * JSON. In Cloud Run, ADC is injected automatically by the runtime.
 *
 * SECURITY: All credentials loaded from environment variables or GCP ADC.
 * No hardcoded values.
 */
import { GoogleAuth } from 'google-auth-library';
import { createLogger } from '../../shared/logger';
import { NotificationError } from '../../shared/errors';

const logger = createLogger('notifications-service');

// ─── FCM message types ────────────────────────────────────────────────────────

/** Android-specific FCM message overrides. */
export interface FCMAndroidConfig {
  priority?: 'normal' | 'high';
  ttl?: number;
  notification?: {
    visibility?: 'private' | 'public' | 'secret';
  };
}

/** APNs-specific FCM message overrides (iOS). */
export interface FCMApnsConfig {
  payload?: {
    aps?: {
      criticalSound?: {
        critical: boolean;
        name: string;
        volume: number;
      };
    };
  };
}

/** Typed FCM V1 message payload. */
export interface FCMMessage {
  topic?: string;
  token?: string;
  condition?: string;
  notification?: {
    title: string;
    body: string;
  };
  data?: Record<string, string>;
  android?: FCMAndroidConfig;
  apns?: FCMApnsConfig;
}

/** Shape of a successful FCM V1 send response. */
export interface FCMSendResponse {
  name: string;
}

// ─── Client class ─────────────────────────────────────────────────────────────

export class FCMSender {
  private auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
  });

  /**
   * @description Obtains a short-lived OAuth2 access token via ADC for
   * authenticating against the FCM V1 REST API.
   *
   * @returns {Promise<string>} OAuth2 bearer token.
   * @throws {NotificationError} When ADC fails to return a valid token.
   *
   * @example
   * const token = await sender.getAccessToken()
   */
  private async getAccessToken(): Promise<string> {
    const client = await this.auth.getClient();
    const token = await client.getAccessToken();
    if (!token.token) {
      throw new NotificationError(
        'Failed to retrieve access token via Application Default Credentials'
      );
    }
    return token.token;
  }

  /**
   * @description Sends a single FCM V1 message to a topic, token, or condition.
   * Uses the HTTP V1 API (`/v1/projects/{projectId}/messages:send`).
   *
   * @param {FCMMessage} message - The FCM message payload to send.
   * @returns {Promise<FCMSendResponse>} FCM response containing the message name.
   * @throws {NotificationError} When the FCM API returns a non-2xx response.
   *
   * @example
   * const response = await sender.sendMessage({
   *   topic: 'venue-001-attendees',
   *   notification: { title: 'Alert', body: 'Zone A is crowded' }
   * })
   * // response: { name: 'projects/my-project/messages/0:1234567890' }
   */
  async sendMessage(message: FCMMessage): Promise<FCMSendResponse> {
    const projectId = process.env.PROJECT_ID;
    if (!projectId) {
      throw new NotificationError('PROJECT_ID environment variable is not set');
    }

    const accessToken = await this.getAccessToken();
    const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      logger.error('sendMessage', 'FCM API request failed', {
        status: response.status,
        projectId,
      });
      throw new NotificationError(
        `FCM V1 API returned ${response.status}`,
        { status: response.status, body: errBody }
      );
    }

    const result = (await response.json()) as FCMSendResponse;
    return result;
  }
}
