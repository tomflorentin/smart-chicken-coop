//
// Created by tomfl on 8/3/2024.
//

#include <Arduino.h>
#include "ElectricFence.h"
#include "func.h"

ElectricFence::ElectricFence(MQTTServer &_server, uint8_t _pin) : relay(_pin), server(_server) {

}

void ElectricFence::setup() {
    relay.setup();
}

void ElectricFence::work() {
//    unsigned int currentTime = millis();
//    if (!this->enabled) {
//        this->relay.write(false);
//        return;
//    }
//    if (this->isPulsing) {
//        if (currentTime - this->lastPulseTime > PULSE_DURATION) {
//            Log("End of pulse");
//            this->relay.write(false);
//            this->isPulsing = false;
//        }
//    } else {
//        if (currentTime - this->lastPulseTime > PULSE_INTERVAL) {
//            Log("Starting pulse");
//            this->relay.write(true);
//            this->lastPulseTime = currentTime;
//            this->isPulsing = true;
//        }
//    }
}

void ElectricFence::enable() {
    this->enabled = true;
    this->relay.write(true);
//    this->lastPulseTime = millis();
//    this->isPulsing = false;
    this->server.publish("enclos/fence/info", "enabled");
}

void ElectricFence::disable() {
    this->enabled = false;
//    this->isPulsing = false;
    this->relay.write(false);
    this->server.publish("enclos/fence/info", "disabled");
}
