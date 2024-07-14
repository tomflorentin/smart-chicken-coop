
#include "WebServer.h"
#include "DoorController.h"
#include "func.h"
#include "ManualControl.h"

WebServer server(80);
DoorController door(27, 26, 33, 25, 14, 36);
ManualControl manualControl(32);

void setup() {
    Serial.begin(9200);
    server.setup();
    door.setup();
    while(!server.isConnected()) {
        delay(1000);
        server.reconnect();
    }
    Notify("Poulailler started");
}


void loop(){
    manualControl.work(door.getStatus());
    server.work();
    door.work();
    Order action = manualControl.getAction();
    if (action == Order::NONE)
        action = server.getAction();
    if (action != Order::NONE)
        Log("Action received");
    door.executeOrder(action);

//     Build the infos
    Infos infos;
    infos.doorIsOpen = door.getStatus() == DoorStatus::OPENED;
    infos.doorIsClosed = door.getStatus() == DoorStatus::CLOSED;
    infos.isDoorMoving = door.getStatus() == DoorStatus::OPENING || door.getStatus() == DoorStatus::SAFE_CLOSING || door.getStatus() == DoorStatus::FORCE_CLOSING;
    infos.isDoorBlocked = door.getLastOrderStatus() == LastOrderStatus::ERROR_BLOCKED;
    infos.lastOrderStatus = door.getLastOrderStatus();

    server.setInfos(infos);
}
