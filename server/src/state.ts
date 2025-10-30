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
  CLOSE = 'close',
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
    door: {
      lastOrder: DoorOrder;
      lastOrderDate: Date;
      status: DoorStatus;
    };
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
}

const State: StateType = {
  enclos: {
    lastSeen: null,
    bootTime: null,
    online: false,
    wifi: null,
    door: {
      lastOrder: null,
      lastOrderDate: null,
      status: null,
    },
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
};

export default State;
