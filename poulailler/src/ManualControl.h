//
// Created by tomfl on 7/8/2024.
//

#ifndef POULAILLER_MANUALCONTROL_H
#define POULAILLER_MANUALCONTROL_H


#include <cstdint>
#include "typings.h"
#include "PinReader/TouchPinReader.h"
#include "PinReader/MultiTouchPinReader.h"
#include "MQTTServer.h"

class ManualControl {
public:
    explicit ManualControl(MQTTServer &_server, uint8_t _pin);
    Order getAction();
    void work(DoorStatus doorStatus);

private:
    Order action = Order::NONE;
    MultiTouchPinReader pin;
    bool isPressed = false;
    MQTTServer &server;
};


#endif //POULAILLER_MANUALCONTROL_H
