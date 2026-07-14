export const LOCATION_TASK_NAME = "parking-ns-background-location";

export const PARK_DETECT_MINUTES = 3;
export const STOPPED_SPEED_MS = 0.6;
export const MOVING_SPEED_MS = 1.5;

export const REMINDER_MINUTES_BEFORE_EXPIRY = 10;

export const NOMINATIM_ENDPOINT = "https://nominatim.openstreetmap.org/reverse";
export const NOMINATIM_MIN_INTERVAL_MS = 1100;
export const NOMINATIM_USER_AGENT = "ParkingNS-MVP/0.1 (kontakt: zameni-ovo@primer.rs)";

export const STORAGE_KEYS = {
  TRACKING_ENABLED: "@parkingns/trackingEnabled",
  VEHICLE_PLATE: "@parkingns/vehiclePlate",
  MOTION_STATE: "@parkingns/motionState",
};
