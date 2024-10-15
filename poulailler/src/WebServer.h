//
// Created by tomfl on 4/27/2024.
//

#ifndef POULAILLER_WEBSERVER_H
#define POULAILLER_WEBSERVER_H

#include <WiFi.h>
#include <HTTPClient.h>
#include <cstdint>
#include "../include/func.h"
#include "DoorController.h"
#include "typings.h"


class WebServer {
public:
    WebServer(short port = 4242);
    bool setup();
    bool isConnected();
    void work();

    Order getAction();
    void setInfos(Infos const & infos);
    void reconnect();

private:
    Order action;
    WiFiServer server;
    Infos infos;

    String readRequest(WiFiClient &client);
    String handleRequest(String const &request);
    void sendResponse(WiFiClient &client, String const &response);
};


#endif //POULAILLER_WEBSERVER_H
