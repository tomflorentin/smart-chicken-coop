//
// Created by tomfl on 5/1/2024.
//

#include <esp32-hal.h>
#include <Arduino.h>
#include "LaserSafety.h"

const int LASER_TIMEOUT = 50000;
const int LASER_PICK_INTERVAL = 5;

const int SAFE_MINIMUM_DIFF = 5;
const float SAFE_MINIMUM_RATIO = 1.05;

LaserSafety::LaserSafety(uint8_t _emitPin, uint8_t _receivePin) : emitPin(_emitPin), receivePin(_receivePin) {
}

void LaserSafety::setup() {
    emitPin.setup();
    receivePin.setup();
}

bool LaserSafety::isSafe() const {
    Log("Failures in a row : " + String(this->failuresInARow));
    return this->failuresInARow <= 3;
}

bool LaserSafety::startLaser() {
    unsigned long currentTime = millis();
    this->laserMeasuring = true;
    this->measurementStartedTime = currentTime;
    this->pickingStartedTime = currentTime;
    this->pickingStoppedTime = currentTime;
    this->failuresInARow = 0;
    if (!this->makeInitialPicks()) {
        this->laserMeasuring = false;
        emitPin.write(false);
        Log("Failed to start laser, brightness ratio is too low");
        return false;
    }
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
            this->totalPicks++;
            Log("Laser on brightness : " + String(this->pickingBrightnessLaserOn) + " Laser off brightness : " + String(this->pickingBrightnessLaserOff));
            if (this->areResultsSafe(this->pickingBrightnessLaserOff, this->pickingBrightnessLaserOn)) {
                Log("Results are safe");
                this->failuresInARow = 0;
            } else {
                Log("Results are not safe. Failures : " + String(this->failuresInARow) + "/5" );
                this->failuresInARow++;
            }
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
    if (this->totalPicks) {
        Log("Picked a total of " + String(this->totalPicks) + " times");
    }
    this->totalPicks = 0;
}

bool LaserSafety::areResultsSafe(uint16_t laserOffBrightness, uint16_t laserOnBrightness) {
//    return laserOnBrightness > laserOffBrightness;
    if (laserOffBrightness == 0 && laserOnBrightness != 0)
        return true;
    if (laserOffBrightness == laserOnBrightness)
        return false;
    if (laserOnBrightness - laserOffBrightness < SAFE_MINIMUM_DIFF)
        return false;
    if ((float)laserOnBrightness / (float)laserOffBrightness < SAFE_MINIMUM_RATIO)
        return false;
    return true;
}

bool LaserSafety::makeInitialPicks() {
    uint8_t success = 0;
    uint8_t failed = 0;
    for (int i = 0; i < 5; i++) {
        int brightnessLaserOff = receivePin.readRaw();
        emitPin.write(true);
        delay(LASER_PICK_INTERVAL);
        int brightnessLaserOn = receivePin.readRaw();
        Log("Pick " + String(i) + " Laser on brightness : " + String(brightnessLaserOn) + " Laser off brightness : " + String(brightnessLaserOff));
        emitPin.write(false);
        delay(LASER_PICK_INTERVAL);
        if (this->areResultsSafe(brightnessLaserOff, brightnessLaserOn)) {
            Log("Pick " + String(i) + " is safe");
            success++;
        } else {
            Log("Pick " + String(i) + " is not safe");
            failed++;
        }
    }
    Log("Success : " + String(success) + " Failed : " + String(failed) + " Result : " + String(success > failed ? "SAFE" : "NOT SAFE"));
    return success > failed;

}
