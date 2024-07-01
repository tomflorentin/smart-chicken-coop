//
// Created by tomfl on 5/1/2024.
//

#include "DoorController.h"

DoorController::DoorController(uint8_t motorPin1, uint8_t motorPin2, uint8_t closedLimitSwitchPin,
                               uint8_t openedLimitSwitchPin, uint8_t laserEmitPin, uint8_t laserReceivePin)
                               : laserSafety(laserEmitPin, laserReceivePin),
                               closedLimitSwitch(closedLimitSwitchPin, true, true),
                               openedLimitSwitch(openedLimitSwitchPin, true, true),
                               motor(motorPin1, motorPin2)
{

}

void DoorController::setup() {
    laserSafety.setup();
    closedLimitSwitch.setup();
    openedLimitSwitch.setup();
    motor.setup();
}

void DoorController::work() {
    if (status == DoorStatus::OPENING) {
        if (openedLimitSwitch.read()) {
            Log("OPENED LIMIT SWITCH READ");
            status = DoorStatus::OPENED;
            if (lastOrderStatus != LastOrderStatus::NO_LAST_ORDER) {
                lastOrderStatus = LastOrderStatus::DONE;
            }
            this->motor.standby();
        }
    } else if (status == DoorStatus::CLOSING) {
        this->laserSafety.work();
        if (closedLimitSwitch.read()) {
            Log("CLOSE LIMIT SWITCH READ");
            status = DoorStatus::CLOSED;
            if (lastOrderStatus != LastOrderStatus::NO_LAST_ORDER) {
                lastOrderStatus = LastOrderStatus::DONE;
            }
            this->motor.standby();
            this->laserSafety.stopLaser();
        }
        if (!laserSafety.isSafe()) {
            Log("LASER SAFETY NOT SAFE");
            status = DoorStatus::OPENING;
            lastOrderStatus = LastOrderStatus::ERROR_LASER_STARTUP;
            this->motor.backward(255);
            this->laserSafety.stopLaser();
        }
    } else if (status == DoorStatus::FORCE_CLOSING) {
        if (closedLimitSwitch.read()) {
            Log("CLOSE LIMIT SWITCH READ");
            status = DoorStatus::CLOSED;
            lastOrderStatus = LastOrderStatus::DONE;
            this->motor.standby();
        }
    }
}

void DoorController::executeOrder(Order order) {
    this->lastOrderStatus = LastOrderStatus::NO_LAST_ORDER;
    switch (order) {
        case Order::OPEN_DOOR:
            Log("Opening door");
            if (openedLimitSwitch.read()) {
                this->lastOrderStatus = LastOrderStatus::ERROR_ALREADY_SAME_STATE;
            } else {
                this->status = DoorStatus::OPENING;
                this->lastOrderStatus = LastOrderStatus::IN_PROGRESS;
                this->motor.backward(255);
            }
            break;
        case Order::CLOSE_DOOR:
            Log("Closing door");
            if (closedLimitSwitch.read()) {
                lastOrderStatus = LastOrderStatus::ERROR_ALREADY_SAME_STATE;
            } else if (!laserSafety.startLaser()) {
                lastOrderStatus = LastOrderStatus::ERROR_BLOCKED;
            } else {
                status = DoorStatus::CLOSING;
                lastOrderStatus = LastOrderStatus::IN_PROGRESS;
                motor.forward(255);
            }
            break;
        case Order::FORCE_CLOSE_DOOR:
            Log("Force closing door");
            if (closedLimitSwitch.read()) {
                lastOrderStatus = LastOrderStatus::ERROR_ALREADY_SAME_STATE;
            } else {
                status = DoorStatus::FORCE_CLOSING;
                lastOrderStatus = LastOrderStatus::IN_PROGRESS;
                motor.forward(255);
            }
            break;
        default:
            break;
    }
}

DoorStatus DoorController::getStatus() const {
    return this->status;
}

LastOrderStatus DoorController::getLastOrderStatus() const {
    return this->lastOrderStatus;
}
