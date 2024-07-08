//
// Created by tomfl on 7/8/2024.
//

#ifndef POULAILLER_MANUALCONTROL_H
#define POULAILLER_MANUALCONTROL_H


#include <cstdint>
#include "typings.h"
#include "PinReader/DigitalPinReader.hpp"

class ManualControl {
public:
    explicit ManualControl(uint8_t _pin);
    Order getAction();
    void work(DoorStatus doorStatus);

private:
    Order action = Order::NONE;
    DigitalPinReader pin;
    bool isPressed = false;
};


#endif //POULAILLER_MANUALCONTROL_H
