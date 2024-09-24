require('dotenv').config();
import { Logger } from '@nestjs/common';
import * as process from 'process';

const url = 'http://api.pushover.net/1/messages.json';
const PUSHOVER_TOKEN = process.env.PUSHOVER_TOKEN as string;
const PUSHOVER_USER = process.env.PUSHOVER_USER as string;
const SEND_NOTIF = process.env.SEND_NOTIF?.toLowerCase() === 'true';

if (!PUSHOVER_TOKEN?.length || !PUSHOVER_USER?.length) {
  throw new Error('Missing Pushover token or user');
}

let notificationQueue: string[] = [];
let notificationTimer: NodeJS.Timeout | null = null;
let notificationResolvers: Array<(value: boolean) => void> = [];

export async function Notify(message: string): Promise<boolean> {
  if (!SEND_NOTIF) {
    Logger.log('Notif skipped : ' + message);
    return true;
  }

  notificationQueue.push(message);

  return new Promise((resolve) => {
    notificationResolvers.push(resolve);

    if (!notificationTimer) {
      notificationTimer = setTimeout(async () => {
        const messagesToSend = notificationQueue.join(', ');
        notificationQueue = [];
        notificationTimer = null;

        const body = {
          token: PUSHOVER_TOKEN,
          user: PUSHOVER_USER,
          title: 'Poulailler',
          message: messagesToSend,
        };

        try {
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
          });

          const payload = await response.json();

          const result = payload.status === 1;
          Logger.log(
            `Notification sent: ${messagesToSend} / result: ${result ? 'success' : 'failure'}`,
          );

          // Résoudre toutes les promesses en attente
          notificationResolvers.forEach((res) => res(result));
          notificationResolvers = [];
        } catch (error) {
          console.error('Error sending notification:', error);

          // Résoudre toutes les promesses avec false en cas d'erreur
          notificationResolvers.forEach((res) => res(false));
          notificationResolvers = [];
        }
      }, 10000); // Délai de 10 secondes
    }
  });
}
