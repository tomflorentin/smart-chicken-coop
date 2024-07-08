//
// Created by tomfl on 7/8/2024.
//

#include "ManualControl.h"

ManualControl::ManualControl(uint8_t _pin) : pin(_pin, true) {
}

Order ManualControl::getAction() {
    Order _action = this->action;
    this->action = NONE;
    return _action;
}

void ManualControl::work(DoorStatus doorStatus) {
    bool currentState = this->pin.read();
    if (currentState && !this->isPressed) {
        this->action = (doorStatus != DoorStatus::OPENED) ? Order::OPEN_DOOR : Order::CLOSE_DOOR;
    }
    this->isPressed = currentState;
}
