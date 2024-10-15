//
// Created by tomfl on 8/3/2024.
//

#include <Arduino.h>
#include "ElectricFence.h"
#include "func.h"

#define BLINK_DURATION 100
#define BLINK_INTERVAL 3000

ElectricFence::ElectricFence(MQTTServer &_server, uint8_t _relayPin, uint8_t _manualSwitch, uint8_t _infoLedR, uint8_t _infoLedG)
    : server(_server),
        relay(_relayPin),
        redLed(_infoLedR),
        greenLed(_infoLedG),
        manualSwitch(_manualSwitch, true)
{
}

void ElectricFence::setup() {
    this->manualSwitch.setup();
    this->relay.setup();
    this->redLed.setup();
    this->greenLed.setup();
}

void ElectricFence::work() {
    unsigned int currentTime = millis();
    if (this->manualSwitch.read()) {
        if (currentTime - this->lastButtonPressTime > 1000) {
            if (this->enabled) {
                this->disable();
            } else {
                this->enable();
            }
            this->lastButtonPressTime = currentTime;
        }
    }
    if (this->isBlinking) {
        if (currentTime - this->lastBlinkTime > BLINK_DURATION) {
            this->redLed.write(false);
            this->greenLed.write(false);
            this->isBlinking = false;
        }
    } else {
        if (currentTime - this->lastBlinkTime > BLINK_INTERVAL) {
            if (this->enabled) {
                this->redLed.write(true);
            } else {
                this->greenLed.write(true);
            }
            this->lastBlinkTime = currentTime;
            this->isBlinking = true;
        }
    }
}

void ElectricFence::enable() {
    this->enabled = true;
    this->relay.write(true);
    this->redLed.write(true);
    this->lastBlinkTime = millis();
    this->isBlinking = false;
    this->server.publish("enclos/fence/info", "enabled");
}

void ElectricFence::disable() {
    this->enabled = false;
    this->relay.write(false);
    this->greenLed.write(true);
    this->lastBlinkTime = millis();
    this->isBlinking = false;
    this->server.publish("enclos/fence/info", "disabled");
}

String ElectricFence::getStatusStr() const {
    return this->enabled ? "enabled" : "disabled";
}

