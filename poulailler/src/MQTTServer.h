//
// Created by tomfl on 9/4/2024.
//

#ifndef ENCLOS_MQTTSERVER_H
#define ENCLOS_MQTTSERVER_H


#include <WiFi.h>
#include "Interfaces/ISetupable.hpp"
#include "lib/PubSubClient.h"
#include "typings.h"
#include "SafeConnection.h"

class MQTTServer : ISetupable {
public:
    void setup() override;
    void work();
    void publish(const char* topic, const char* message);
    Order getAction();

private:
    SafeConnection safeConnection = SafeConnection("poulailler");
    void handleCallback(char* topic, byte* payload, unsigned int length);
    Order lastOrder = Order::NONE;
};


#endif //ENCLOS_MQTTSERVER_H
