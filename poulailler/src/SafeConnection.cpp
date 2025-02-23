//
// Created by tomfl on 9/23/2024.
//

#include <WiFi.h>

#include <utility>
#include "SafeConnection.h"
#include "credentials.h"
#include "func.h"

#define SCAN_INTERVAL 1000*3600
#define GIVEUP_TIME 30000


void SafeConnection::setup() {
    this->mqttClient.setServer("192.168.1.111", 1883);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    Log("Safe connection setup done");
}

void SafeConnection::work() {

    if (this->needToSwitchToBackup()) {
        Log("Switching to backup");
        WiFi.disconnect();
        WiFi.begin(BACKUP_WIFI_SSID, BACKUP_WIFI_PASSWORD);
        this->backupMode = true;
        this->connectionLostTime = 0;
    }
    if (this->needToSwitchToNormal()) {
        Log("Switching to normal");
        WiFi.disconnect();
        WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
        this->backupMode = false;
        this->connectionLostTime = 0;
    }
    if (WiFi.status() == WL_CONNECTED) {
        if (this->mqttClient.state() != MQTT_CONNECTED) {
            Log("Not connected to MQTT");
            this->mqttClient.disconnect();
            if (this->mqttClient.connect(("esp32-" + this->name).c_str())) {
                for (int i = 0; i < this->topicIndex; i++) {
                    this->mqttClient.subscribe(this->topics[i]);
                }
                this->mqttClient.publish((this->name + "/wifi").c_str(), this->backupMode ? "backup" : "normal");
            }
        } else {
            if (!this->bootSent) {
                this->mqttClient.publish((this->name + "/boot").c_str(), "boot");
                this->bootSent = true;
            }
            this->mqttClient.loop();
        }
    } else {
        Log("Not connected to Wifi + " + String(this->backupMode ? "backup" : "normal"));
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
            this->mqttClient.publish((this->name + "/wifi-scan").c_str(), String(count).c_str());
            this->isScanning = false;
            for (int i = 0; i < count; ++i) {
                this->mqttClient.publish((this->name + "/wifi-scan").c_str(), WiFi.SSID(i).c_str());
                if (WiFi.SSID(i) == WIFI_SSID) {
                    return true;
                }
            }
        }
    } else {
        if (now - this->lastScanTime > SCAN_INTERVAL) {
            this->mqttClient.publish((this->name + "/wifi-scan").c_str(), "start");
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
            Log("Connection lost");
            connectionLostTime = millis();
        } else if (millis() - connectionLostTime > GIVEUP_TIME) {
            Log("Giveup time reached " + String(millis() - connectionLostTime));
            return true;
        }
    } else {
        connectionLostTime = 0;
        return false;
    }
    return false;
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
