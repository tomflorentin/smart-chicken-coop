export enum FenceOrder {
  ENABLE = 'enable',
  DISABLE = 'disable',
  STATUS = 'status',
}

export enum AlertOrder {
  ENABLE = 'enable',
  DISABLE = 'disable',
  STATUS = 'status',
}

export enum DoorOrder {
  SAFE_CLOSE = 'safe_close',
  FORCE_CLOSE = 'force_close',
  OPEN = 'open',
  STATUS = 'status',
}

export enum DoorStatus {
  OPENED = 'opened',
  CLOSED = 'closed',
  OPENING = 'opening',
  FORCE_CLOSING = 'force_closing',
  SAFE_CLOSING = 'safe_closing',
  OBSTRUCTED = 'safe_closing_obstructed',
  ABORTED = 'safe_closing_aborted',
  BLOCKED = 'blocked',
}

export enum FenceStatus {
  ENABLED = 'enabled',
  DISABLED = 'disabled',
}

export enum AlertStatus {
  ENABLED = 'enabled',
  DISABLED = 'disabled',
  ALERT = 'alert',
  RESTORED = 'restored',
}

export interface Detections {
  dates: Date[];
  timeInAlert: number;
  lastDetection: Date;
}

export interface StateType {
  enclos: {
    online: boolean;
    wifi: 'normal' | 'backup' | null;
    bootTime: Date;
    lastSeen: Date;
    electricFence: {
      lastOrder: FenceOrder;
      lastOrderDate: Date;
      status: FenceStatus;
    };
    alertSystem: {
      lastDetectionDetector: number;
      lastDetectionDate: Date;
      status: AlertStatus;
      lastOrder: AlertOrder;
      lastOrderDate: Date;
      detections: Detections;
    };
  };
  poulailler: {
    online: boolean;
    wifi: 'normal' | 'backup' | null;
    bootTime: Date;
    lastSeen: Date;
    door: {
      lastOrder: DoorOrder;
      lastOrderDate: Date;
      status: DoorStatus;
    };
  };
}

const State: StateType = {
  enclos: {
    lastSeen: null,
    bootTime: null,
    online: false,
    wifi: null,
    electricFence: {
      lastOrder: null,
      lastOrderDate: null,
      status: null,
    },
    alertSystem: {
      lastDetectionDetector: null,
      lastDetectionDate: null,
      lastOrder: null,
      lastOrderDate: null,
      status: null,
      detections: {
        dates: [],
        timeInAlert: 0,
        lastDetection: null,
      },
    },
  },
  poulailler: {
    online: false,
    wifi: null,
    bootTime: null,
    lastSeen: null,
    door: {
      lastOrder: null,
      lastOrderDate: null,
      status: null,
    },
  },
};

export default State;
