export enum FenceOrder {
  ENABLE = 'enable',
  DISABLE = 'disable',
  STATUS = 'status',
}

export enum AlertOrder {
  ENABLE = 'alert_enable',
  DISABLE = 'alert_disable',
  STATUS = 'status',
}

export enum DoorOrder {
  SAFE_CLOSE = 'door_safe_close',
  FORCE_CLOSE = 'door_force_close',
  OPEN = 'door_open',
  STATUS = 'status',
}

export enum DoorStatus {
  OPENED = 'opened',
  CLOSED = 'closed',
  OPENING = 'opening',
  FORCE_CLOSING = 'force_closing',
  SAFE_CLOSING = 'safe_closing',
}

export enum FenceStatus {
  ENABLED = 'enabled',
  DISABLED = 'disabled',
}

export enum AlertStatus {
  ENABLED = 'enabled',
  DISABLED = 'disabled',
  ALERT = 'alert',
}

export interface StateType {
  enclos: {
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
    };
  };
  poulailler: {
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
    },
  },
  poulailler: {
    lastSeen: null,
    door: {
      lastOrder: null,
      lastOrderDate: null,
      status: null,
    },
  },
};

export default State;
