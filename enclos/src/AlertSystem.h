//
// Created by tomfl on 7/20/2024.
//

#ifndef POULAILLER_ALERTSYSTEM_H
#define POULAILLER_ALERTSYSTEM_H


#include <cstdint>
#include "PinReader/DigitalPinReader.hpp"
#include "PinReader/DigitalPinWriter.hpp"
#include "lib/LinkedList.h"
#include "MQTTServer.h"

struct AlertLog {
    unsigned long startTime;
    unsigned long endTime;
    unsigned int numberOfDetections;
};

class AlertSystem : public ISetupable {
public:
    AlertSystem(MQTTServer &_server, uint8_t _detector1, uint8_t _detector2, uint8_t _lightPin);
    void work();
    void setup() override;

    void enable();
    void disable();
    String getStatusStr() const;

private:
    MQTTServer &server;
    bool enabled = false;
    unsigned long alertStartedTime = 0;
    unsigned long alertLastDetectedTime = 0;
    unsigned int numberOfDetections = 0;
    DigitalPinReader detector1;
    DigitalPinReader detector2;
    DigitalPinWriter lightPin;
    LinkedList<AlertLog> alertList;
    bool isBooted = false;
    unsigned long bootTime;
};


#endif //POULAILLER_ALERTSYSTEM_H
