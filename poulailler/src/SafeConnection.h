//
// Created by tomfl on 9/23/2024.
//

#ifndef ENCLOS_SAFECONNECTION_H
#define ENCLOS_SAFECONNECTION_H


#include "Interfaces/ISetupable.hpp"
#include "lib/PubSubClient.h"

class SafeConnection : ISetupable {
public:
    explicit SafeConnection(char const *_name);
    void setup() override;
    void addTopic(const char * topic);
    void work();
    void setCallback(MQTT_CALLBACK_SIGNATURE);
    bool publish(const char * topic, const char * message);


private:
    bool needToSwitchToNormal();
    bool needToSwitchToBackup();
    unsigned long connectionLostTime = 0;
    bool backupMode = false;
    unsigned long lastScanTime = 0;
    bool isScanning = false;

    char const * topics[10] = {nullptr};
    unsigned short topicIndex = 0;
    String name;

    WiFiClient wiFiClient;
    PubSubClient mqttClient = PubSubClient(wiFiClient);
    bool bootSent = false;
};


#endif //ENCLOS_SAFECONNECTION_H
