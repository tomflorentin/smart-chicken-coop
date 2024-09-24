//
// Created by tomfl on 9/17/2024.
//

#include <Arduino.h>
#include "LongDigitalPinReader.h"
#include "func.h"

LongDigitalPinReader::LongDigitalPinReader(uint8_t pin, bool pullup, bool _reverse) : DigitalPinReader(pin, pullup,
                                                                                                       _reverse) {

}

void LongDigitalPinReader::setup() {
    DigitalPinReader::setup();
}

bool LongDigitalPinReader::read() {
    unsigned long currentTime = millis();

    this->work();
    if (!this->lastTrueStart) {
        return false;
    }
    return (currentTime - this->lastTrueStart) > 1000;
}

void LongDigitalPinReader::work() {
    unsigned long currentTime = millis();

    if (DigitalPinReader::read()) {
        if (this->lastTrueStart == 0) {
            this->lastTrueStart = currentTime;
        }
    } else {
        if (this->lastTrueStart != 0) {
            this->lastTrueStart = 0;
        }
    }
}
