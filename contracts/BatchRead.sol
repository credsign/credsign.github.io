pragma solidity ^0.4.2;

import "CredSign.sol";

contract BatchRead {

    CredSign private api;
    bool public initialized = false;

    function init(address credSign) {
        if (initialized) {
            throw;
        }
        else {
            initialized = true;
            api = CredSign(credSign);
        }
    }

    function getChannelsByRanks(uint256 startRank, uint256 endRank) public constant returns (uint256[], uint256[], uint256[]) {
        if (startRank == 0 || endRank < startRank || endRank > api.getNumChannels()) {
            throw;
        }
        uint256 numResults = 1 + endRank - startRank;

        uint256[] memory channelIDs = new uint256[](numResults);
        uint256[] memory channelCred = new uint256[](numResults);
        uint256[] memory channelRanks = new uint256[](numResults);

        for (uint256 i = 0; i < numResults; i++) {
            (channelIDs[i], channelRanks[i]) = api.getChannelByRank(startRank + i);
            channelCred[i] = api.getChannelCred(channelIDs[i]);
        }
        return (channelIDs, channelCred, channelRanks);
    }

    function getContentsByRanks(uint256 startRank, uint256 endRank, uint256 channelID) public constant returns (uint256[], uint256[], uint256[]) {
        if (startRank == 0 || endRank < startRank || endRank > api.getNumContents(channelID)) {
            throw;
        }
        uint256 numResults = 1 + endRank - startRank;

        uint256[] memory contentIDs = new uint256[](numResults);
        uint256[] memory contentCred = new uint256[](numResults);
        uint256[] memory contentRanks = new uint256[](numResults);

        for (uint256 i = 0; i < numResults; i++) {
            (contentIDs[i], contentRanks[i]) = api.getContentByRank(startRank + i, channelID);
            contentCred[i] = api.getContentCred(contentIDs[i]);
        }
        return (contentIDs, contentCred, contentRanks);
    }

    // metadata for latest in channel/ latest signed
    function getCredRanksByContents(uint256[] contentIDs) public constant returns (uint256[], uint256[]) {
        uint256[] memory contentCred = new uint256[](contentIDs.length);
        uint256[] memory contentRanks = new uint256[](contentIDs.length);

        for (uint256 i = 0; i < contentIDs.length; i++) {
            contentCred[i] = api.getContentCred(contentIDs[i]);
            contentRanks[i] = api.getContentRank(contentIDs[i]);
        }
        return (contentCred, contentRanks);
    }

    function getContentsFundedByAccount(address account) public constant returns (uint256[], uint256[]) {
        uint256[] memory contentIDs = new uint256[](api.getNumContentsFundedByAccount(account));
        uint256[] memory contentCred = new uint256[](contentIDs.length);

        for (uint i = 0; i < contentIDs.length; i++) {
            contentIDs[i] = api.getNextContentFundedByAccount(account, (i > 0 ? contentIDs[i - 1] : 0));
            contentCred[i] = api.getContentCredSignedByAccount(account, contentIDs[i]);
        }
        return (contentIDs, contentCred);
    }
}
