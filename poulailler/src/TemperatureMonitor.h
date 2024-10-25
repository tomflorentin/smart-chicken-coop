//
// Created by tomfl on 10/21/2024.
//

#ifndef POULAILLER_TEMPERATUREMONITOR_H
#define POULAILLER_TEMPERATUREMONITOR_H


#include <cstdint>
#include "Interfaces/ISetupable.hpp"
#include "MQTTServer.h"
#include "lib/DHT.hpp"

class TemperatureMonitor : ISetupable {
public:
    explicit TemperatureMonitor(MQTTServer &_server, uint8_t pin);
    void setup() override;
    void work();

private:
    MQTTServer &server;
    DHT dht;
    unsigned long lastSend = 0;

};


#endif //POULAILLER_TEMPERATUREMONITOR_H
