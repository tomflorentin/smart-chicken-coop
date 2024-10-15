//
// Created by tomfl on 7/9/2024.
//

#ifndef POULAILLER_TOUCHPINREADER_H
#define POULAILLER_TOUCHPINREADER_H


#include <cstdint>
#include "Interfaces/ISetupable.hpp"

class TouchPinReader : ISetupable {
public:
    explicit TouchPinReader(uint8_t _pin, int _sampleRate);
    bool read();
    void setup() override;
    void work();

private:
    uint8_t pin;
    int sampleRate;
    unsigned int sampleStartTime = 0;
    unsigned int sampleTrue = 0;
    unsigned int sampleFalse = 0;
    bool isActivated = false;
    bool hasBeenReset = true;
};


#endif //POULAILLER_TOUCHPINREADER_H
