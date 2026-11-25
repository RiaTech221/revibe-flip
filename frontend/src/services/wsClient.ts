import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { API_BASE_URL, getAccessToken } from './httpClient';

export const getWsUrl = (): string => {
  const base = API_BASE_URL.replace(/\/api\/?$/, '');
  return `${base}/ws`;
};

export const createStompClient = (onConnectCallback: (client: Client) => void): Client | null => {
  const token = getAccessToken();
  if (!token) return null;

  const client = new Client({
    webSocketFactory: () => new SockJS(getWsUrl()),
    connectHeaders: {
      Authorization: `Bearer ${token}`,
    },
    reconnectDelay: 5000,
    onConnect: () => {
      onConnectCallback(client);
    },
  });

  client.activate();
  return client;
};

export type { Client, IMessage, StompSubscription };
