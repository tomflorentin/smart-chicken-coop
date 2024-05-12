//
// Created by tomfl on 5/1/2024.
//

#include <esp32-hal.h>
#include <Arduino.h>
#include "LaserSafety.h"

const int LASER_TIMEOUT = 50000;
const int LASER_PICK_INTERVAL = 100;

const int SAFE_MINIMUM_DIFF = 100;
const float SAFE_MINIMUM_RATIO = 1.2;

LaserSafety::LaserSafety(uint8_t _emitPin, uint8_t _receivePin) : emitPin(_emitPin), receivePin(_receivePin) {
}

void LaserSafety::setup() {
    emitPin.setup();
    receivePin.setup();
}

bool LaserSafety::isSafe() const {
    return this->_isSafe;
}

bool LaserSafety::startLaser() {
    unsigned long currentTime = millis();
    this->laserMeasuring = true;
    this->measurementStartedTime = currentTime;
    this->pickingStartedTime = currentTime;
    this->pickingStoppedTime = currentTime;
    uint16_t laserOffBrightness = receivePin.readRaw();
    emitPin.write(true);
    delay(LASER_PICK_INTERVAL);
    uint16_t laserOnBrightness = receivePin.readRaw();
    emitPin.write(false);
    this->_isSafe = this->areResultsSafe(laserOffBrightness, laserOnBrightness);
    if (!this->_isSafe) {
        this->laserMeasuring = false;
        emitPin.write(false);
        Log("Failed to start laser, brightness ratio is too low");
        Log("Laser off brightness : " + String(laserOffBrightness));
        Log("Laser on brightness : " + String(laserOnBrightness));
        return false;
    }
    Log("Laser on brightness : " + String(laserOnBrightness) + " Laser off brightness : " + String(laserOffBrightness));
    return true;
}

void LaserSafety::work() {
    const unsigned long currentTime = millis();

    if (!this->laserMeasuring) {
        return;
    }
    if (currentTime - this->measurementStartedTime > LASER_TIMEOUT) {
        emitPin.write(false);
        this->laserMeasuring = false;
        return;
    }

    // Now start the real work
    if (this->isPicking) {
        if (currentTime - this->pickingStartedTime > LASER_PICK_INTERVAL) {
            Log("Stopping picking");
            this->pickingBrightnessLaserOn = receivePin.readRaw();
            this->isPicking = false;
            this->pickingStoppedTime = currentTime;
            emitPin.write(false);
            Log("Laser on brightness : " + String(this->pickingBrightnessLaserOn) + " Laser off brightness : " + String(this->pickingBrightnessLaserOff));
            this->_isSafe = this->areResultsSafe(this->pickingBrightnessLaserOff, this->pickingBrightnessLaserOn);
            Log("Picking results : " + String(this->_isSafe));
        }
    } else {
        if (currentTime - this->pickingStoppedTime > LASER_PICK_INTERVAL) {
            Log("Starting picking");
            this->pickingBrightnessLaserOff = receivePin.readRaw();
            this->isPicking = true;
            this->pickingStartedTime = currentTime;
            emitPin.write(true);
        }
    }


}

void LaserSafety::stopLaser() {
    this->laserMeasuring = false;
    emitPin.write(false);
}

bool LaserSafety::areResultsSafe(uint16_t laserOffBrightness, uint16_t laserOnBrightness) {
    if (laserOffBrightness == 0 && laserOnBrightness != 0)
        return true;
    if (laserOffBrightness == laserOnBrightness)
        return false;
    if (laserOnBrightness - laserOffBrightness < SAFE_MINIMUM_DIFF)
        return false;
    if (laserOnBrightness / laserOffBrightness < SAFE_MINIMUM_RATIO)
        return false;
    return true;
}
