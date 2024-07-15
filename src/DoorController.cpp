//
// Created by tomfl on 5/1/2024.
//

#include "DoorController.h"
#define STEPS_TIME 1000
#define CONFIRM_TIME 500

DoorController::DoorController(uint8_t motorPin1, uint8_t motorPin2, uint8_t closedLimitSwitchPin,
                               uint8_t openedLimitSwitchPin, uint8_t laserEmitPin, uint8_t laserReceivePin)
                               : laserSafety(laserEmitPin, laserReceivePin),
                               closedLimitSwitch(closedLimitSwitchPin, true, true),
                               openedLimitSwitch(openedLimitSwitchPin, true, false),
                               motor(motorPin1, motorPin2)
{

}

void DoorController::setup() {
    laserSafety.setup();
    closedLimitSwitch.setup();
    openedLimitSwitch.setup();
    motor.setup();
    if (closedLimitSwitch.read()) {
        status = DoorStatus::CLOSED;
    } else if (openedLimitSwitch.read()) {
        status = DoorStatus::OPENED;
    } else {
        this->status = DoorStatus::FORCE_CLOSING;
    }
}

void DoorController::work() {
    if (status == DoorStatus::OPENING) {
        if (openedLimitSwitch.read()) {
            finalizeOrder(openedLimitSwitch, DoorStatus::OPENED);
        }
    } else if (status == DoorStatus::SAFE_CLOSING) {
        if (closedLimitSwitch.read()) {
            finalizeOrder(closedLimitSwitch, DoorStatus::CLOSED);
        } else if (millis() - stepStartedTime >= STEPS_TIME) {
            this->motor.standby();
            if (this->laserSafety.makeInitialPicks()) {
                this->motor.forward(255);
                this->stepStartedTime = millis();
            } else {
                Log("Laser blocked, reverse");
                this->motor.backward(255);
                this->status = DoorStatus::OPENING;
            }
        }
    } else if (status == DoorStatus::FORCE_CLOSING) {
        if (closedLimitSwitch.read()) {
            finalizeOrder(closedLimitSwitch, DoorStatus::CLOSED);
        }
    }
}

void DoorController::executeOrder(Order order) {
    this->lastOrderStatus = LastOrderStatus::NO_LAST_ORDER;
    if (order != Order::NONE) {
        this->orderStartTime = millis();
    }
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
        case Order::SAFE_CLOSE_DOOR:
            Log("Closing door");
            if (closedLimitSwitch.read()) {
                lastOrderStatus = LastOrderStatus::ERROR_ALREADY_SAME_STATE;
            } else if (!laserSafety.startLaser()) {
                lastOrderStatus = LastOrderStatus::ERROR_BLOCKED;
            } else {
                status = DoorStatus::SAFE_CLOSING;
                lastOrderStatus = LastOrderStatus::IN_PROGRESS;
                this->stepStartedTime = millis();
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

void DoorController::finalizeOrder(const DigitalPinReader & endPin, DoorStatus _doorStatus) {
    this->motor.suspendAction();
    delay(CONFIRM_TIME);
    if (!endPin.read()) {
        Log("Error, end pin not reached");
        this->motor.resumeAction();
        return;
    }
    this->motor.standby();

    this->laserSafety.stopLaser();
    unsigned int endMillis = millis();
    unsigned int time = endMillis - this->orderStartTime;
    Log("Order finished in " + String((float)time/1000.f) + "s");
    this->status = _doorStatus;
    if (lastOrderStatus != LastOrderStatus::NO_LAST_ORDER) {
        lastOrderStatus = LastOrderStatus::DONE;
    }
}
