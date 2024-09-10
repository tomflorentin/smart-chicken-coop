//
// Created by tomfl on 7/8/2024.
//

#include <Arduino.h>
#include "ManualControl.h"
#include "func.h"


ManualControl::ManualControl(MQTTServer &_server, uint8_t _pin) : server(_server), pin(_pin, 100, 500, 3) {
}

Order ManualControl::getAction() {
    Order _action = this->action;
    this->action = NONE;
    return _action;
}

void ManualControl::work(DoorStatus doorStatus) {
    this->pin.work();
    bool currentState = this->pin.read();
    if (currentState && !this->isPressed) {
        Log("Touch detected, current status: " + String(doorStatus));
        if (doorStatus == DoorStatus::OPENED || doorStatus == DoorStatus::OPENING) {
            this->server.publish("enclos/manual-control/info", "open");
            this->action = Order::FORCE_CLOSE_DOOR;
        } else if (doorStatus == DoorStatus::CLOSED || doorStatus == DoorStatus::SAFE_CLOSING) {
            this->server.publish("enclos/manual-control/info", "close");
            this->action = Order::OPEN_DOOR;
        }
    }
    this->isPressed = currentState;
}
