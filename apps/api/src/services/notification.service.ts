import { Notification, type INotification } from '../models/notification.model.js';

export async function notify(input: Omit<Pick<INotification, 'recipientId' | 'type' | 'title' | 'body' | 'link'>, 'recipientId'> & { recipientId: INotification['recipientId'] | string }): Promise<void> {
  await Notification.create(input);
}
