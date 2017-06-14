pragma solidity ^0.4.3;

import './Token.sol';

contract Fund {

    address private contentAddress;

    function Fund() {
        contentAddress = msg.sender;
    }

    function claim(address token) returns (uint256 value) {
        if (msg.sender != contentAddress) {
            throw;
        }
        if (token == 0x1) {
            value = this.balance;
            if (!contentAddress.send(value)) {
                throw;
            }
        }
        else {
            value = Token(token).balanceOf(this);
            if (!Token(token).transfer(contentAddress, value)) {
                throw;
            }
        }
        return value;
    }

}
