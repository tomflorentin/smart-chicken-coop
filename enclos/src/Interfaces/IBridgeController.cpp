//
// Created by tomfl on 5/15/2023.
//

#include "IBridgeController.hpp"

void IBridgeController::setSpeed(signed char speed) {
    if (speed > 0) {
        forward(speed);
    } else if (speed < 0) {
        backward(-speed);
    } else {
        standby();
    }
}

IBridgeController::IBridgeController() {

}
