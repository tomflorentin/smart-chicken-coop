//
// Created by tomfl on 5/1/2024.
//

#ifndef POULAILLER_LASERSAFETY_H
#define POULAILLER_LASERSAFETY_H


#include <cstdint>
#include "Interfaces/ISetupable.hpp"
#include "PinReader/DigitalPinWriter.hpp"
#include "PinReader/AnalogPinReader.hpp"
#include "../include/func.h"

class LaserSafety : public ISetupable {
    public:
    LaserSafety(uint8_t _emitPin, uint8_t _receivePin);
    void setup() override;
    void work();
    bool isSafe() const;
    bool startLaser();
    void stopLaser();

private:
    int failuresInARow = 0;
    bool laserMeasuring = false;
    unsigned long measurementStartedTime = 0;
    DigitalPinWriter emitPin;
    AnalogPinReader receivePin;

    bool makeInitialPicks();
    bool areResultsSafe(uint16_t laserOffBrightness, uint16_t laserOnBrightness);
    bool isPicking = false;
    unsigned long pickingStartedTime = 0;
    unsigned long pickingStoppedTime = 0;
    uint16_t pickingBrightnessLaserOff = 0;
    uint16_t pickingBrightnessLaserOn = 0;
};


#endif //POULAILLER_LASERSAFETY_H
