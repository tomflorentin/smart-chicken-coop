//
// Created by tomfl on 7/9/2024.
//

#include <Arduino.h>
#include "MultiTouchPinReader.h"
#include "func.h"


MultiTouchPinReader::MultiTouchPinReader(uint8_t _pin, int _minMillis, int _maxMillis, uint8_t _numberOfTouches) :
        pin(_pin, _minMillis), minMillis(_minMillis), maxMillis(_maxMillis), numberOfTouchesToTrigger(_numberOfTouches)
{
}

void MultiTouchPinReader::setup() {
    this->pin.setup();
}

bool MultiTouchPinReader::read() {
    bool _isActivated = this->isActivated;
    this->isActivated = false;
    return _isActivated;
}

void MultiTouchPinReader::work() {
    this->pin.work();
    unsigned long currentTime = millis();


    if (this->pin.read()) {
        if (currentTime - this->lastTouchTime >= this->minMillis) {
            Log("Touch ok !");
            this->currentNumberOfTouches++;
            this->lastTouchTime = currentTime;
        } else {
            Log("Too soon");
        }
    } else {
        if (currentTime - this->lastTouchTime > this->maxMillis) {
            if (this->currentNumberOfTouches != 0) {
                Log("Reset");
            }
            this->currentNumberOfTouches = 0;
        }
    }
    if (this->currentNumberOfTouches >= this->numberOfTouchesToTrigger) {
        Log("Activated");
        this->isActivated = true;
        this->currentNumberOfTouches = 0;
    }
}
