//
// Created by tomfl on 7/20/2024.
//

#include <Arduino.h>
#include "AlertSystem.h"
#include "func.h"

#define ALERT_DURATION 1000 * 10 * 1
#define DETECTION_INTERVAL 1000 * 5

AlertSystem::AlertSystem(MQTTServer &_server, uint8_t _detector1, uint8_t _detector2, uint8_t _detector3, uint8_t _lightPin) :
    detector1(_detector1, false),
    detector2(_detector2, false),
    detector3(_detector3, false),
    lightPin(_lightPin),
    server(_server)
{
}


void AlertSystem::work() {
    if (!this->enabled)
        return;
    const unsigned long currentTime = millis();

    if (!isBooted) {
        if (currentTime - this->bootTime < (60000)) {
            return;
        } else {
            isBooted = true;
            this->server.publish("enclos/alert/info", "booted");
            Notify("Système d'alerte initialisé");
        }
    }

    const bool pin1State = detector1.read();
    const bool pin2State = detector2.read();

    if ((pin1State || pin2State) && ((currentTime - this->alertLastDetectedTime) > DETECTION_INTERVAL)) {
        this->lightPin.write(true);
        if (pin1State) {
            this->server.publish("enclos/alert/info", "alert 1");
            Notify("Détection sur détecteur 1");
        }
        if (pin2State) {
            this->server.publish("enclos/alert/info", "alert 2");
            Notify("Detection sur détecteur 2");
        }
        this->numberOfDetections++;
        this->alertLastDetectedTime = currentTime;
        if (this->alertStartedTime == 0) {
            this->alertStartedTime = currentTime;
        }
    }
    if (this->numberOfDetections == 0)
        return;

    if (currentTime - this->alertLastDetectedTime > ALERT_DURATION) {
        this->alertList.add({this->alertStartedTime, currentTime, this->numberOfDetections});
        this->numberOfDetections = 0;
        this->alertStartedTime = 0;
        this->lightPin.write(false);
        Notify("Alerte terminée");
    }
}

void AlertSystem::setup() {
    detector1.setup();
    detector2.setup();
    lightPin.setup();
    lightPin.write(false);
    this->isBooted = false;
    this->bootTime = millis();
}

bool AlertSystem::isInAlert() const {
    return this->numberOfDetections != 0;
}

void AlertSystem::enable() {
    this->enabled = true;
}

void AlertSystem::disable() {
    this->enabled = false;
}

