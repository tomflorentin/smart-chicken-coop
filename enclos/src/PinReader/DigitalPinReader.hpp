//
// Created by tomfl on 3/18/2023.
//

#ifndef EMBARQUE_DIGITALPINREADER_HPP
#define EMBARQUE_DIGITALPINREADER_HPP


#include <stdint.h>
#include "PinManager.hpp"

class DigitalPinReader : public PinManager {
public:
    DigitalPinReader(uint8_t pin, bool pullup, bool _reverse = false);

    virtual bool read();
    void setup() override;

private:
    uint8_t readMode;
    bool reverse;
};


#endif //EMBARQUE_DIGITALPINREADER_HPP
