//
// Created by tomfl on 5/11/2024.
//

#ifndef POULAILLER_TYPINGS_H
#define POULAILLER_TYPINGS_H

#include <cstdint>


enum DoorStatus {
    OPENED = 1,
    CLOSED = 2,
    CLOSING = 3,
    OPENING = 4,
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
    DOOR_OPEN = 1,
    DOOR_CLOSE = 2,
    STATUS_DOOR = 3,
    ENABLE_ELECTRIC_FENCE = 4,
    DISABLE_ELECTRIC_FENCE = 5,
    STATUS_ELECTRIC_FENCE = 6,
    PING = 7,
};


#endif //POULAILLER_TYPINGS_H
