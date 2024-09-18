//
// Created by tomfl on 9/4/2024.
//

#ifndef ENCLOS_MQTTSERVER_H
#define ENCLOS_MQTTSERVER_H


#include <WiFi.h>
#include "Interfaces/ISetupable.hpp"
#include "lib/PubSubClient.h"
#include "typings.h"

class MQTTServer : ISetupable {
public:
    void setup() override;
    void work();
    void publish(const char* topic, const char* message);
    Order getAction();
    bool connect();

private:
    WiFiClient espClient;
    PubSubClient client = PubSubClient(espClient);
    void handleCallback(char* topic, byte* payload, unsigned int length);
    Order lastOrder = Order::NONE;
    unsigned long lastConnectionCheck = 0;
    bool backupMode = false;
};


#endif //ENCLOS_MQTTSERVER_H
