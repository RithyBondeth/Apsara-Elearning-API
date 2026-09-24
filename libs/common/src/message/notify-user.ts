import { Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';
import { CreateNotificationDTO, USER_SERVICE } from '@app/contracts';

const NOTIFY_TIMEOUT_MS = 5000;

/**
 * Raise an in-app notification for a learner — best effort.
 *
 * Deliberately never throws and never rejects, unlike `rpcCall`. A notification
 * is a side effect of something the learner has already earned: a broker hiccup
 * must not roll back the quiz score, the XP, or the certificate that triggered
 * it. Failures are logged and swallowed.
 */
export async function notifyUser(
  client: ClientProxy,
  notification: CreateNotificationDTO,
  logger?: Logger,
): Promise<void> {
  try {
    await firstValueFrom(
      client
        .send(USER_SERVICE.ACTIONS.NOTIFICATION_CREATE, notification)
        .pipe(timeout(NOTIFY_TIMEOUT_MS)),
    );
  } catch (error) {
    logger?.error(
      `Notification "${notification.type}" failed for ${notification.userId}: ${
        error instanceof Error ? error.message : error
      }`,
    );
  }
}
