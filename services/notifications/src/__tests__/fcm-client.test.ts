const getAccessTokenMock = jest.fn();
const getClientMock = jest.fn();

jest.mock('google-auth-library', () => ({
  GoogleAuth: jest.fn().mockImplementation(() => ({
    getClient: getClientMock,
  })),
}));

import { FCMSender } from '../fcm_sender';

describe('FCMSender', () => {
  let sender: FCMSender;
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env.PROJECT_ID = 'smart-venue-test';
    getAccessTokenMock.mockReset();
    getClientMock.mockReset().mockResolvedValue({
      getAccessToken: getAccessTokenMock,
    });
    global.fetch = jest.fn();
    sender = new FCMSender();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('should send a message to the FCM REST API with the bearer token', async () => {
    getAccessTokenMock.mockResolvedValue({ token: 'access-token-123' });
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ name: 'projects/smart-venue-test/messages/42' }),
    });

    const result = await sender.sendMessage({ token: 'device-token', notification: { title: 'Alert' } });

    expect(global.fetch).toHaveBeenCalledWith(
      'https://fcm.googleapis.com/v1/projects/smart-venue-test/messages:send',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer access-token-123',
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({
          message: { token: 'device-token', notification: { title: 'Alert' } },
        }),
      }),
    );
    expect(result).toEqual({ name: 'projects/smart-venue-test/messages/42' });
  });

  it('should throw when application default credentials do not return a token', async () => {
    getAccessTokenMock.mockResolvedValue({ token: null });

    await expect(sender.sendMessage({ token: 'device-token' })).rejects.toThrow(
      'Failed to retrieve access token via application default credentials',
    );
  });
});
