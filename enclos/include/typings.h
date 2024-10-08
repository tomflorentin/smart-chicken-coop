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
};

enum LastOrderStatus {
    NO_LAST_ORDER = 0,
    IN_PROGRESS = 1,
    DONE = 2,
    ERROR_BLOCKED = 3,
    ERROR_ALREADY_SAME_STATE = 4,
    ERROR_LASER_STARTUP = 5,
};

enum Order : uint8_t {
    NONE = 0,
    ENABLE_ALERT = 1,
    DISABLE_ALERT = 2,
    STATUS_ALERT = 3,
    ENABLE_ELECTRIC_FENCE = 4,
    DISABLE_ELECTRIC_FENCE = 5,
    STATUS_ELECTRIC_FENCE = 6,
    PING = 7,
};


#endif //POULAILLER_TYPINGS_H
