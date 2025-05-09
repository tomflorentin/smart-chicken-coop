//
// Created by tomfl on 5/11/2024.
//

#ifndef POULAILLER_TYPINGS_H
#define POULAILLER_TYPINGS_H

#include <cstdint>

enum DoorStatus {
    OPENED = 1,
    CLOSED = 2,
    SAFE_CLOSING = 3,
    OPENING = 4,
    FORCE_CLOSING = 5,
    BLOCKED = 6,
};


enum LastOrderStatus {
    NO_LAST_ORDER = 0,
    IN_PROGRESS = 1,
    DONE = 2,
    ERROR_BLOCKED = 3,
    ERROR_ALREADY_SAME_STATE = 4,
    ERROR_LASER_STARTUP = 5,
    ERROR_TIMEOUT = 6
};

enum Order : uint8_t {
    NONE = 0,
    SAFE_CLOSE_DOOR = 1,
    OPEN_DOOR = 2,
    FORCE_CLOSE_DOOR = 3,
    STATUS_DOOR = 4,
    PING = 5,
    FORCE_MOVE_UP = 6,
    FORCE_MOVE_DOWN = 7,
};

struct Infos {
    bool doorIsOpen;
    bool doorIsClosed;
    bool isDoorMoving;
    bool isDoorBlocked;
    LastOrderStatus lastOrderStatus;
};

#endif //POULAILLER_TYPINGS_H
