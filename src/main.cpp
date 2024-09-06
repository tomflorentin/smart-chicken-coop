#include "func.h"
#include "AlertSystem.h"
#include "ElectricFence.h"
#include "MQTTServer.h"

MQTTServer server;
AlertSystem alertSystem(server, 2, 16, 1, 17);
ElectricFence electricFence(server, 18);

void setup() {
    Serial.begin(9600);
    server.setup();
    alertSystem.setup();
    electricFence.setup();
    Notify("Enclos démarré");
//    server.publish("enclos/fence", "started");
    alertSystem.enable();
}

unsigned long lastTime = 0;
bool lastState = false;

void loop(){
    server.work();
    alertSystem.work();
    electricFence.work();
    const unsigned long currentTime = millis();
    if (currentTime - lastTime > 1000) {
        Log("1 second passed");
        lastTime = currentTime;
        if (lastState) {
            Log("Enable electric fence");
            electricFence.enable();
        } else {
            Log("Disable electric fence");
            electricFence.disable();
        }
        lastState = !lastState;
    }

//    Order action = server.getAction();
//    if (action != Order::NONE)
//        Log("Action received");
//    if (action == Order::ENABLE_ALERT)
//        alertSystem.enable();
//    if (action == Order::DISABLE_ALERT)
//        alertSystem.disable();
//    if (action == Order::ENABLE_ELECTRIC_FENCE)
//        electricFence.enable();
//    if (action == Order::DISABLE_ELECTRIC_FENCE)
//        electricFence.disable();

//     Build the infos
//    Infos infos;
//    infos.doorIsOpen = door.getStatus() == DoorStatus::OPENED;
//    infos.doorIsClosed = door.getStatus() == DoorStatus::CLOSED;
//    infos.isDoorMoving = door.getStatus() == DoorStatus::OPENING || door.getStatus() == DoorStatus::SAFE_CLOSING || door.getStatus() == DoorStatus::FORCE_CLOSING;
//    infos.isDoorBlocked = door.getLastOrderStatus() == LastOrderStatus::ERROR_BLOCKED;
//    infos.lastOrderStatus = door.getLastOrderStatus();

//    server.setInfos(infos);
}
