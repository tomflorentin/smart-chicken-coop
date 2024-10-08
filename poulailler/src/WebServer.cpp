//
// Created by tomfl on 4/27/2024.
//

#include <sstream>
#include "WebServer.h"
#include "func.h"
#include "credentials.h"


const char* ssid = WIFI_SSID;
const char* password = WIFI_PASSWORD;

const char* standard_accepted = "{ \"status\": \"accepted\" }";

WebServer::WebServer(short port) : server(port) {

}

bool WebServer::setup() {
   Serial.print("Connecting to ");
   Log(ssid);
   WiFi.begin(ssid, password);
   while (WiFi.status() != WL_CONNECTED) {
     delay(500);
     Serial.print(".");
   }
    Log("");
    Log("WiFi connected.");
    Log("IP address: ");
    Log(WiFi.localIP().toString());
    server.begin();
    return true;
}

bool WebServer::isConnected() {
    return WiFi.isConnected();
}

void WebServer::work() {
    WiFiClient client = server.available();
    if (!client) {
        return;
    }
    String request = this->readRequest(client);
    Log(request);
    String response = this->handleRequest(request);
    this->sendResponse(client, response);
}

Order WebServer::getAction() {
    Order _action = this->action;
    this->action = NONE;
    return _action;
}

String WebServer::readRequest(WiFiClient &client) {
    unsigned long const startTime = millis();
    String request = "";
    while (client.connected()) {
        if (millis() - startTime > 1000) {
            return "";
        }
        if (client.available()) {
            char c = client.read();
            request += c;
            if (c == '\n') {
                break;
            }
        }
    }
    return request;
}

void WebServer::setInfos(const Infos &_infos) {
    this->infos = _infos;
}

String WebServer::handleRequest(const String &request) {
    if (request.indexOf("GET /infos") != -1) {
        std::stringstream ss;
        ss << "{";
        ss << "\"status\": \"accepted\",";
        ss << "\"doorIsOpen\": " << this->infos.doorIsOpen << ",";
        ss << "\"doorIsClosed\": " << this->infos.doorIsClosed << ",";
        ss << "\"isDoorMoving\": " << this->infos.isDoorMoving << ",";
        ss << "\"isDoorBlocked\": " << this->infos.isDoorBlocked << ",";
        ss << "\"lastOrderStatus\": " << this->infos.lastOrderStatus;
        ss << "}";
        return ss.str().c_str();
    }
    else if (request.indexOf("GET /logs") != -1) {
        return "{ \"status\": \"accepted\", \"logs\": " + getJsonLogs() + " }";
    }
    else if (request.indexOf("GET /action/open") != -1) {
        this->action = OPEN_DOOR;
        return standard_accepted;
    }
    else if (request.indexOf("GET /action/close") != -1) {
        this->action = SAFE_CLOSE_DOOR;
        return standard_accepted;
    } else if (request.indexOf("GET /action/force-close") != -1) {
        this->action = FORCE_CLOSE_DOOR;
        return standard_accepted;
    }
    return "{ \"status\": \"unknown command\" }";
}

void WebServer::sendResponse(WiFiClient &client, const String &response) {
    client.flush();
    client.println("HTTP/1.1 200 OK");
    client.println("Content-Type: application/json");
    client.println("Connection: close");
    client.println("");
    client.println(response);
    client.println("");
}

void WebServer::reconnect() {
    WiFi.reconnect();
    Serial.print("Reconnecting to wifi");
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    Log("");
    Log("WiFi reconnected.");
}
