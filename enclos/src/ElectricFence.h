//
// Created by tomfl on 8/3/2024.
//

#ifndef ENCLOS_ELECTRICFENCE_H
#define ENCLOS_ELECTRICFENCE_H


#include <cstdint>
#include "Interfaces/ISetupable.hpp"
#include "PinReader/DigitalPinWriter.hpp"
#include "MQTTServer.h"
#include "PinReader/DigitalPinReader.hpp"
#include "PinReader/LongDigitalPinReader.h"

class ElectricFence : ISetupable {
public:
    explicit ElectricFence(MQTTServer &_server, uint8_t _relayPin, uint8_t _manualSwitch, uint8_t _infoLedR, uint8_t _infoLedG);
    void setup() override;
    void work();
    void enable();
    void disable();
    String getStatusStr() const;

private:
    MQTTServer &server;
    DigitalPinWriter relay;
    DigitalPinWriter redLed;
    DigitalPinWriter greenLed;
    LongDigitalPinReader manualSwitch;
    bool enabled = false;
    unsigned long lastBlinkTime = 0;
    bool isBlinking = false;
    unsigned long lastButtonPressTime = 0;


};


#endif //ENCLOS_ELECTRICFENCE_H
