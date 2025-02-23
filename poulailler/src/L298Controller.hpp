//
// Created by tomfl on 3/19/2023.
//

#ifndef EMBARQUE_L298CONTROLLER_HPP
#define EMBARQUE_L298CONTROLLER_HPP


#include <stdint.h>
#include "PinReader/AnalogPinWriter.hpp"
#include "Interfaces/ISetupable.hpp"
#include "Interfaces/IBridgeController.hpp"
#include "../include/func.h"

class L298Controller : public IBridgeController {
public:
    L298Controller(uint8_t in1, uint8_t in2);
    void forward(uint8_t speed) override;
    void backward(uint8_t speed) override;
    void brake() override;
    void standby() override;
    void setup() override;
    void suspendAction();
    void resumeAction();
    bool getIsSuspended() const;


private:
    AnalogPinWriter pin1;
    AnalogPinWriter pin2;
    uint8_t lastValue1 = 0;
    uint8_t lastValue2 = 0;
    bool isSuspended = false;
};


#endif //EMBARQUE_L298CONTROLLER_HPP
