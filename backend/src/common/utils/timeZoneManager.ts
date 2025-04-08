import { Subscriber } from "@/api/subscription/model";
import pino from "pino";

interface TimeZoneGroup {
  offset: number;
  subscribers: Map<string, Subscriber>;
}

export class TimeZoneGroupManager {
  private groups: Map<number, TimeZoneGroup>;
  private logger: pino.Logger;
  private hourlyTimer?: ReturnType<typeof setInterval>;
  private onSendCallback: (subscribers: Subscriber[]) => Promise<void>;

  constructor(sendCallback: (subscribers: Subscriber[]) => Promise<void>) {
    this.groups = new Map();
    this.onSendCallback = sendCallback;
    this.logger = pino({
      name: "TimeZoneGroupManager",
      level: process.env.LOG_LEVEL || "info",
      transport: {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
        },
      },
    });

    // Initialize time zone groups (-12 to +14)
    for (let offset = -12; offset <= 14; offset++) {
      this.groups.set(offset, {
        offset,
        subscribers: new Map(),
      });
    }
  }

  // Initialize the manager with subscribers
  initializeWithSubscribers(subscribers: Subscriber[]): void {
    subscribers.forEach((sub) => {
      this.addOrUpdateSubscriber(sub);
    });
    this.logger.info(`Initialized with ${subscribers.length} subscribers`);
    this.startHourlyCheck();
  }

  // Start hourly check
  private startHourlyCheck(): void {
    // Clear existing timer if any
    if (this.hourlyTimer) {
      clearInterval(this.hourlyTimer);
    }

    // 计算距离下一个整点的时间
    const now = new Date();
    const minutesToNextHour = 60 - now.getMinutes();
    const msToNextHour =
      minutesToNextHour * 60 * 1000 -
      now.getSeconds() * 1000 -
      now.getMilliseconds();

    // 先设置一个定时器到下一个整点
    setTimeout(() => {
      this.hourlyCheck();
      // 然后开始每小时运行的定时器
      this.hourlyTimer = setInterval(
        () => {
          this.hourlyCheck();
        },
        60 * 60 * 1000,
      );
    }, msToNextHour);

    this.logger.info(
      `Scheduled hourly check to start in ${Math.round(msToNextHour / 1000 / 60)} minutes`,
    );
  }

  // Hourly check for each time zone group
  private async hourlyCheck(): Promise<void> {
    const now = new Date();
    const utcHour = now.getUTCHours();

    for (const [offset, group] of this.groups) {
      // Calculate local hour for this time zone
      const localHour = (utcHour + offset + 24) % 24;

      // If it's 7 AM in this time zone
      if (localHour === 7) {
        this.logger.info(
          `Processing subscribers for timezone offset ${offset} (${group.subscribers.size} subscribers)`,
        );
        await this.processSendTask(group);
      }
    }
  }

  // Process send task for a group
  private async processSendTask(group: TimeZoneGroup): Promise<void> {
    const subscribersToSend = Array.from(group.subscribers.values()).filter(
      (sub) => !sub.hasSent,
    );

    if (subscribersToSend.length === 0) {
      return;
    }

    try {
      await this.onSendCallback(subscribersToSend);

      // Mark as sent in memory
      subscribersToSend.forEach((sub) => {
        const subscriber = group.subscribers.get(sub._id);
        if (subscriber) {
          subscriber.hasSent = true;
        }
      });

      this.logger.info(
        `Successfully processed ${subscribersToSend.length} subscribers for timezone offset ${group.offset}`,
      );
    } catch (error) {
      this.logger.error(
        `Error processing subscribers for timezone offset ${group.offset}:`,
        error,
      );
    }
  }

  // Add or update a subscriber
  addOrUpdateSubscriber(subscriber: Subscriber): void {
    const oldGroup = this.findSubscriberGroup(subscriber._id);
    if (oldGroup) {
      oldGroup.subscribers.delete(subscriber._id);
    }

    const group = this.groups.get(subscriber.timeOffset);
    if (!group) {
      this.logger.error(
        `Invalid time offset ${subscriber.timeOffset} for subscriber ${subscriber._id}`,
      );
      return;
    }

    group.subscribers.set(subscriber._id, subscriber);
  }

  // Remove a subscriber
  removeSubscriber(subscriberId: string): void {
    const group = this.findSubscriberGroup(subscriberId);
    if (group) {
      group.subscribers.delete(subscriberId);
      this.logger.info(`Removed subscriber ${subscriberId}`);
    }
  }

  // Reset sent status for a specific time zone group
  resetGroupSentStatus(offset: number): void {
    const group = this.groups.get(offset);
    if (group) {
      for (const subscriber of group.subscribers.values()) {
        subscriber.hasSent = false;
      }
      this.logger.info(`Reset sent status for timezone offset ${offset}`);
    }
  }

  // Helper to find which group a subscriber is in
  private findSubscriberGroup(subscriberId: string): TimeZoneGroup | null {
    for (const group of this.groups.values()) {
      if (group.subscribers.has(subscriberId)) {
        return group;
      }
    }
    return null;
  }

  // Clean up
  destroy(): void {
    if (this.hourlyTimer) {
      clearInterval(this.hourlyTimer);
    }
  }
}
