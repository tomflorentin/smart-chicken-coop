//
// Created by tomfl on 8/3/2024.
//

#ifndef ENCLOS_ELECTRICFENCE_H
#define ENCLOS_ELECTRICFENCE_H


#include <cstdint>
#include "Interfaces/ISetupable.hpp"
#include "PinReader/DigitalPinWriter.hpp"
#include "MQTTServer.h"

#define PULSE_DURATION 500
#define PULSE_INTERVAL 2500

class ElectricFence : ISetupable {
public:
    explicit ElectricFence(MQTTServer &_server, uint8_t _pin);
    void setup() override;
    void work();
    void enable();
    void disable();
    String getStatusStr() const;

private:
    MQTTServer &server;
    DigitalPinWriter relay;
    bool enabled = false;
//    unsigned long lastPulseTime = 0;
//    bool isPulsing = false;

};


#endif //ENCLOS_ELECTRICFENCE_H
