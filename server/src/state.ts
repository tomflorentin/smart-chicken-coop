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

export interface StateType {
  enclos: {
    lastSeen: Date;
    electricFence: {
      lastOrder: FenceOrder;
      lastOrderDate: Date;
      status: string;
    };
    alertSystem: {
      lastDetectionDetector: number;
      lastDetectionDate: Date;
      status: string;
      lastOrder: AlertOrder;
      lastOrderDate: Date;
    };
  };
  poulailler: {
    lastSeen: Date;
    door: {
      lastOrder: DoorOrder;
      lastOrderDate: Date;
      status: string;
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
