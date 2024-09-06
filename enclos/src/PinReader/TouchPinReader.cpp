//
// Created by tomfl on 7/9/2024.
//

#include <esp32-hal-touch.h>
#include "TouchPinReader.h"
#include "func.h"

#define TOUCH_THRESHOLD 20

TouchPinReader::TouchPinReader(uint8_t _pin, int _sampleRate) : pin(_pin), sampleRate(_sampleRate) {

}

bool TouchPinReader::read() {
    bool _isActivated = this->isActivated;
    this->isActivated = false;
    return _isActivated;
}

void TouchPinReader::setup() {

}

void TouchPinReader::work() {
    unsigned int currentTime = millis();

    if (currentTime - this->sampleStartTime > this->sampleRate) {
        if (this->sampleTrue > this->sampleFalse) {
            Log("Activated " + String(this->hasBeenReset));
            this->isActivated = this->hasBeenReset;
            this->hasBeenReset = false;
        } else {
            if (!this->hasBeenReset) {
                Log("has been Reset");
            }
            this->hasBeenReset = true;
        }
        this->sampleStartTime = currentTime;
        this->sampleTrue = 0;
        this->sampleFalse = 0;
    } else {
        int readValue = touchRead(this->pin);
        if (readValue < TOUCH_THRESHOLD) {
            this->sampleTrue++;
        } else {
            this->sampleFalse++;
        }
    }
}
