import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  vitest,
  Mock,
} from "vitest";
import { TimeZoneGroupManager } from "@/common/utils/timeZoneManager";
import { Subscriber } from "@/api/subscription/model";
import MockDate from "mockdate";

describe("TimeZoneManager Tests", () => {
  let timeZoneManager: TimeZoneGroupManager;
  let mockCallback: Mock;
  let mockSubscribers: Subscriber[];

  beforeEach(() => {
    mockCallback = vitest.fn();
    timeZoneManager = new TimeZoneGroupManager(mockCallback);

    // Create mock subscribers in different time zones
    mockSubscribers = [
      createMockSubscriber({ timeOffset: 8, email: "asia@test.com" }), // UTC+8
      createMockSubscriber({ timeOffset: 6, email: "asia2@test.com" }), // UTC+8
      createMockSubscriber({ timeOffset: 4, email: "asia3@test.com" }), // UTC+8
      createMockSubscriber({ timeOffset: 0, email: "london@test.com" }), // UTC+0
      createMockSubscriber({ timeOffset: -8, email: "pacific@test.com" }), // UTC-8
    ];

    // Initialize with mock subscribers
    timeZoneManager.initializeWithSubscribers(mockSubscribers);
  });

  afterEach(() => {
    timeZoneManager.destroy();
    MockDate.reset();
    vitest.clearAllMocks();
  });

  // Helper function to create mock subscribers
  function createMockSubscriber(override: Partial<Subscriber>): Subscriber {
    return {
      _id: Math.random().toString(),
      preferredName: "Test User",
      preferredLanguage: "en",
      timeOffset: 0,
      birthdate: new Date("1990-01-01"),
      email: "test@example.com",
      subscriptionDate: new Date(),
      isActive: true,
      token: "test-token",
      tokenExpires: new Date("2025-01-01"),
      sentCount: 0,
      hasSent: false,
      ...override,
    };
  }

  // Helper function to advance time and trigger checks
  async function advanceTimeAndCheck(hours: number) {
    const currentDate = new Date();
    const newTime = new Date(currentDate.getTime() + hours * 60 * 60 * 1000);
    MockDate.set(newTime);

    // Manually trigger hourly check since we're mocking time
    await (timeZoneManager as any).hourlyCheck();
  }

  describe("Daily Execution Tests", () => {
    it("should send emails at 7 AM in each timezone", async () => {
      // Start at UTC 00:00
      MockDate.set("2025-01-01T00:00:00Z");

      // Test a full 24-hour cycle
      for (let hour = 0; hour < 24; hour++) {
        await advanceTimeAndCheck(1);

        const expectedCalls = mockSubscribers.filter((sub) => {
          const localHour = (hour + sub.timeOffset + 24) % 24;
          return localHour === 7;
        });

        if (expectedCalls.length > 0) {
          expect(mockCallback).toHaveBeenCalledWith(
            expect.arrayContaining(expectedCalls),
          );
        }
      }
    });

    it("should not send duplicate emails on the same day", async () => {
      // Set time to just before 7 AM in UTC+8
      MockDate.set("2025-01-01T22:59:00Z"); // Previous day UTC, but 6:59 AM in UTC+8

      // Advance to 7 AM in UTC+8
      await advanceTimeAndCheck(1);
      expect(mockCallback).toHaveBeenCalledWith(
        expect.arrayContaining([mockSubscribers[0]]),
      );

      // Try advancing another hour
      await advanceTimeAndCheck(1);
      expect(mockCallback).toHaveBeenCalledTimes(1);
      await advanceTimeAndCheck(6);
      expect(mockCallback).toHaveBeenCalledTimes(1);
      await advanceTimeAndCheck(6);
      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    it("should reset sent status and send next day", async () => {
      // Start at 7 AM in UTC+8 (UTC 23:00)
      MockDate.set("2025-01-01T23:00:00Z");

      // First send at 7 AM
      await advanceTimeAndCheck(0);
      expect(mockCallback).toHaveBeenCalledWith(
        expect.arrayContaining([mockSubscribers[0]]),
      );
      expect(mockCallback).toHaveBeenCalledTimes(1);

      // Advance to local midnight (UTC 16:00)
      MockDate.set("2025-01-02T16:00:00Z");
      await advanceTimeAndCheck(0);

      // Advance to 7 AM (UTC 23:00)
      MockDate.set("2025-01-02T23:00:00Z");
      await advanceTimeAndCheck(0);

      // Should send again
      expect(mockCallback).toHaveBeenCalledTimes(2);
    });
  });

  describe("System Restart Tests", () => {
    it("should resume correct schedule after restart", async () => {
      // Start at UTC 00:00
      MockDate.set("2025-01-01T00:00:00Z");

      // Simulate system restart by creating new instance
      const newManager = new TimeZoneGroupManager(mockCallback);
      newManager.initializeWithSubscribers(mockSubscribers);

      // Advance to 7 AM in UTC+8
      await advanceTimeAndCheck(23);
      expect(mockCallback).toHaveBeenCalledWith(
        expect.arrayContaining([mockSubscribers[0]]),
      );

      newManager.destroy();
    });

    it("should maintain sent status after restart", async () => {
      // Set initial time to 7 AM in UTC+8
      MockDate.set("2025-01-01T23:00:00Z");

      // Send first batch
      await advanceTimeAndCheck(0);
      expect(mockCallback).toHaveBeenCalledWith(
        expect.arrayContaining([mockSubscribers[0]]),
      );

      // Simulate restart with updated subscribers (hasSent = true)
      const updatedSubscribers = mockSubscribers.map((sub) => ({
        ...sub,
        hasSent: true,
      }));

      const newManager = new TimeZoneGroupManager(mockCallback);
      newManager.initializeWithSubscribers(updatedSubscribers);

      // Advance an hour and verify no duplicate sends
      await advanceTimeAndCheck(1);
      expect(mockCallback).toHaveBeenCalledTimes(1);

      newManager.destroy();
    });
  });

  describe("Error Handling Tests", () => {
    it("should handle send failures gracefully", async () => {
      mockCallback.mockRejectedValueOnce(new Error("Send failed")) as Mock;

      // Set time to 7 AM in UTC+8
      MockDate.set("2025-01-01T23:00:00Z");

      // Should not throw error
      await expect(advanceTimeAndCheck(0)).resolves.not.toThrow();
    });

    it("should retry failed subscribers in next batch", async () => {
      // Make first send fail
      mockCallback.mockRejectedValueOnce(new Error("Send failed")) as Mock;

      // Set time to 7 AM in UTC+8
      MockDate.set("2025-01-01T23:00:00Z");
      await advanceTimeAndCheck(0);

      // Reset mock and advance 24 hours
      mockCallback.mockReset();
      for (let i = 0; i < 24; i++) {
        await advanceTimeAndCheck(1);
      }

      // Should try sending again
      expect(mockCallback).toHaveBeenCalledWith(
        expect.arrayContaining([mockSubscribers[0]]),
      );
    });
  });
});
