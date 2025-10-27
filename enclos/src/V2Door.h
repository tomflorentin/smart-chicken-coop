//
// Created by tomfl on 10/27/2025.
//

#ifndef ENCLOS_V2DOOR_H
#define ENCLOS_V2DOOR_H


#include <cstdint>
#include "Interfaces/ISetupable.hpp"
#include "PinReader/DigitalPinWriter.hpp"
#include "MQTTServer.h"
#include "PinReader/DigitalPinReader.hpp"
#include "PinReader/AnalogPinWriter.hpp"

class V2Door : public ISetupable{
public:
    V2Door(MQTTServer &_server, uint8_t _up_pin, uint8_t _down_pin);

    void open();
    void close();
    void setup() override;
    void work();
    String getStatusStr();

private:
    MQTTServer &server;
    AnalogPinWriter upPin;
    AnalogPinWriter downPin;
    DoorStatus state = DoorStatus::OPENED;
    unsigned long actionStartTime = 0;
    const unsigned long CLOSE_DURATION = 8 * 1000;
    const unsigned long OPEN_DURATION = 10 * 1000;
};


#endif //ENCLOS_V2DOOR_H
