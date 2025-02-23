//
// Created by tomfl on 3/19/2023.
//

#include <WString.h>
#include <Arduino.h>
#include "L298Controller.hpp"

L298Controller::L298Controller(uint8_t in1, uint8_t in2)
        : IBridgeController(),
          pin1(in1),
          pin2(in2) {}

void L298Controller::forward(uint8_t speed) {
    this->pin2.write(0);
    this->pin1.write(speed);
    this->lastValue1 = speed;
    this->lastValue2 = 0;
    this->isSuspended = false;
}

void L298Controller::backward(uint8_t speed) {
    Log("Backward " + String(speed));
    this->pin1.write(0);
    this->pin2.write(speed);
    this->lastValue1 = 0;
    this->lastValue2 = speed;
    this->isSuspended = false;
}

void L298Controller::brake() {
    this->pin1.write(255);
    this->pin2.write(255);
    this->lastValue1 = 255;
    this->lastValue2 = 255;
    this->isSuspended = false;
}

void L298Controller::standby() {
    this->pin1.write(0);
    this->pin2.write(0);
    this->lastValue1 = 0;
    this->lastValue2 = 0;
    this->isSuspended = false;
}

void L298Controller::setup() {
    this->pin1.setup();
    this->pin2.setup();
}

void L298Controller::suspendAction() {
    this->pin1.write(0);
    this->pin2.write(0);
    this->isSuspended = true;
}

void L298Controller::resumeAction() {
    this->pin1.write(this->lastValue1);
    this->pin2.write(this->lastValue2);
    this->isSuspended = false;
}

bool L298Controller::getIsSuspended() const {
    return this->isSuspended;
}
