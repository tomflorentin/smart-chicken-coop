//
// Created by tomfl on 5/1/2024.
//

#ifndef POULAILLER_DOORCONTROLLER_H
#define POULAILLER_DOORCONTROLLER_H

#include <cstdint>
#include "Interfaces/ISetupable.hpp"
#include "LaserSafety.h"
#include "PinReader/DigitalPinReader.hpp"
#include "WebServer.h"
#include "L298Controller.hpp"
#include "typings.h"


const int UNLOCKING_TIME = 5000;

class DoorController : public ISetupable {
public:
    DoorController(uint8_t motorPin1, uint8_t motorPin2, uint8_t closedLimitSwitchPin, uint8_t openedLimitSwitchPin, uint8_t laserEmitPin, uint8_t laserReceivePin);

    void setup() override;
    void work();
    void executeOrder(Order order);
    DoorStatus getStatus() const;
    LastOrderStatus getLastOrderStatus() const;

private:
    LaserSafety laserSafety;
    DigitalPinReader closedLimitSwitch;
    DigitalPinReader openedLimitSwitch;
    DoorStatus status;
    LastOrderStatus lastOrderStatus = LastOrderStatus::NO_LAST_ORDER;
    L298Controller motor;
    unsigned int orderStartTime = 0;

    void finalizeOrder(DoorStatus _status);
};


#endif //POULAILLER_DOORCONTROLLER_H
