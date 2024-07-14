//
// Created by tomfl on 7/9/2024.
//

#ifndef POULAILLER_MULTITOUCHPINREADER_H
#define POULAILLER_MULTITOUCHPINREADER_H


#include <cstdint>
#include "Interfaces/ISetupable.hpp"
#include "TouchPinReader.h"

class MultiTouchPinReader : public ISetupable {
public:
    explicit MultiTouchPinReader(uint8_t _pin, int _minMillis, int _maxMillis, uint8_t _numberOfTouches);
    void setup() override;
    bool read();
    void work();

private:
    TouchPinReader pin;
    int minMillis;
    int maxMillis;
    uint8_t numberOfTouchesToTrigger;
    uint8_t currentNumberOfTouches = 0;
    unsigned long lastTouchTime = 0;

    bool isActivated = false;
};


#endif //POULAILLER_MULTITOUCHPINREADER_H
