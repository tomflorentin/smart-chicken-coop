//
// Created by tomfl on 10/27/2025.
//

#include "V2Door.h"
#include "func.h"

V2Door::V2Door(MQTTServer &_server, uint8_t _up_pin, uint8_t _down_pin) :
    server(_server), upPin(_up_pin), downPin(_down_pin) {
}

void V2Door::open() {
    Log("Door opening");
    this->server.publish("enclos/door/info", "opening");
    this->downPin.write(0);
    this->upPin.write(168);
    this->state = DoorStatus::OPENING;
    this->actionStartTime = millis();
}

void V2Door::close() {
    Log("Door closing");
    this->server.publish("enclos/door/info", "closing");
    this->upPin.write(0);
    this->downPin.write(168);
    this->state = DoorStatus::CLOSING;
    this->actionStartTime = millis();
}

void V2Door::setup() {
    this->upPin.setup();
    this->downPin.setup();
}

void V2Door::work() {
    unsigned long currentTime = millis();
    switch (this->state) {
        case DoorStatus::OPENING:
            if (currentTime - this->actionStartTime >= OPEN_DURATION) {
                this->upPin.write(0);
                this->downPin.write(0);
                this->state = DoorStatus::OPENED;
                this->server.publish("enclos/door/info", "opened");
                Log("Door opened");
            }
            break;
        case DoorStatus::CLOSING:
            if (currentTime - this->actionStartTime >= CLOSE_DURATION) {
                this->downPin.write(0);
                this->upPin.write(0);
                this->state = DoorStatus::CLOSED;
                this->server.publish("enclos/door/info", "closed");
                Log("Door closed");
            }
            break;
        default:
            break;
    }
}

String V2Door::getStatusStr() {
    switch (this->state) {
        case DoorStatus::OPENED:
            return "opened";
        case DoorStatus::CLOSED:
            return "closed";
        case DoorStatus::OPENING:
            return "opening";
        case DoorStatus::CLOSING:
            return "closing";
        default:
            return "unknown";
    }
}
