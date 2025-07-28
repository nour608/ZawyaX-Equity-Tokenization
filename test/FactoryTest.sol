// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.25;


import {Test} from "forge-std/Test.sol";

import {Factory} from "../src/Factory.sol";
import {DataTypes} from "../src/utils/DataTypes.sol";
import {EquityToken} from "../src/EquityToken.sol";
import {UserRegistry} from "../src/UserRegistry.sol";
import {OrderBookLib} from "../src/libraries/OrderBookLib.sol";


contract FactoryTest is Test {
    Factory public factory;
    UserRegistry public userRegistry;

    function setUp() public {
        factory = new Factory();
    }
}