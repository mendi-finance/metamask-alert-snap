export type SnapState = {
  mendiAddress: string;
  threshold: number;
  notificationPeriod: number;
  lastNotificationTime: number | null;
  lastKnownAboveThreshold: boolean;
  customRPCs?: string[];
};
