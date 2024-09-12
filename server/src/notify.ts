require('dotenv').config();
import { Logger } from '@nestjs/common';
import * as process from 'process';

const url = 'http://api.pushover.net/1/messages.json';
const PUSHOVER_TOKEN = process.env.PUSHOVER_TOKEN as string;
const PUSHOVER_USER = process.env.PUSHOVER_USER as string;

if (!PUSHOVER_TOKEN?.length || !PUSHOVER_USER?.length) {
  throw new Error('Missing Pushover token or user');
}

export async function Notify(message: string): Promise<boolean> {
  const body = {
    token: PUSHOVER_TOKEN,
    user: PUSHOVER_USER,
    title: 'Poulailler',
    message: message,
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
      `Notification sent: ${message} / result: ${result ? 'success' : 'failure'}`,
    );

    return result;
  } catch (error) {
    console.error('Error sending notification:', error);
    return false;
  }
}
