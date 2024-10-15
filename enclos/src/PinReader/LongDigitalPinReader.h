//
// Created by tomfl on 9/17/2024.
//

#ifndef ENCLOS_LONGDIGITALPINREADER_H
#define ENCLOS_LONGDIGITALPINREADER_H


#include "DigitalPinReader.hpp"

class LongDigitalPinReader : public DigitalPinReader {
public:
    LongDigitalPinReader(uint8_t pin, bool pullup, bool _reverse = false);
    void setup() override;
    bool read() override;
    void work();

private:
    unsigned long lastTrueStart = 0;
};


#endif //ENCLOS_LONGDIGITALPINREADER_H
