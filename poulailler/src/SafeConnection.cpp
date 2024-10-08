//
// Created by tomfl on 9/23/2024.
//

#include <WiFi.h>

#include <utility>
#include "SafeConnection.h"
#include "credentials.h"
#include "func.h"

#define SCAN_INTERVAL 60000
#define GIVEUP_TIME 30000

void SafeConnection::setup() {
    this->mqttClient.setServer("192.168.1.111", 1883);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
}

void SafeConnection::work() {

    if (this->needToSwitchToBackup()) {
        WiFi.disconnect();
        WiFi.begin(BACKUP_WIFI_SSID, BACKUP_WIFI_PASSWORD);
        this->backupMode = true;
    }
    if (this->needToSwitchToNormal()) {
        WiFi.disconnect();
        WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
        this->backupMode = false;
    }
    if (WiFi.status() == WL_CONNECTED) {
        if (this->mqttClient.state() != MQTT_CONNECTED) {
            this->mqttClient.disconnect();
            if (this->mqttClient.connect(("esp32-" + this->name).c_str())) {
                for (int i = 0; i < this->topicIndex; i++) {
                    this->mqttClient.subscribe(this->topics[i]);
                }
                this->mqttClient.publish((this->name + "/wifi").c_str(), this->backupMode ? "backup" : "normal");
            }
        } else {
            // ALl OK
            Log("MQTT Client loop");
            this->mqttClient.loop();
        }
    } else {
        // Not connected to WiFi
    }
}

bool SafeConnection::needToSwitchToNormal() {
    if (!this->backupMode) {
        return false;
    }
    unsigned long now = millis();
    if (this->isScanning) {
        int count = WiFi.scanComplete();
        if (count >= 0) {
            this->isScanning = false;
            for (int i = 0; i < count; ++i) {
                if (WiFi.SSID(i) == WIFI_SSID) {
                    return true;
                }
            }
        }
    } else {
        if (now - this->lastScanTime > SCAN_INTERVAL) {
            WiFi.scanNetworks(true);
            this->isScanning = true;
            this->lastScanTime = now;
        }
    }
    return false;
}

bool SafeConnection::needToSwitchToBackup() {
    if (WiFiClass::status() != WL_CONNECTED || this->mqttClient.state() != MQTT_CONNECTED) {
        if (connectionLostTime == 0) {
            connectionLostTime = millis();
        } else if (millis() - connectionLostTime > GIVEUP_TIME) {
            return true;
        }
    } else {
        connectionLostTime = 0;
        return false;
    }
}

void SafeConnection::addTopic(const char *topic) {
    topics[topicIndex++] = topic;
}

SafeConnection::SafeConnection(const char *_name) {
    name = _name;
}

void SafeConnection::setCallback(std::function<void(char *, uint8_t *, unsigned int)> callback) {
    this->mqttClient.setCallback(std::move(callback));
}

bool SafeConnection::publish(const char *topic, const char *message) {
    return this->mqttClient.publish(topic, message);
}
