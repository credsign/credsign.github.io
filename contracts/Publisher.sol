pragma solidity ^0.4.2;

import "Indexer.sol";

contract Publisher {

    uint256 public constant CRED = 10**16; // 0.01eth

    struct Content {
        address accountID;
        uint256 channelID;
        uint256 timestamp;
    }

    // contentID: fetch document metadata
    // accountID: generate profile
    // parentID: fetch responses
    event Publish (
        uint256 indexed contentID,
        address indexed accountID,
        uint256 indexed channelID,
        string attributes,
        uint256 sizeBytes,
        uint256 timestamp
    );

    // contentID: fetch the document
    // accountID: notify successful publish
    // nonce: notify successful publish
    event Store (
        uint256 indexed contentID,
        address indexed accountID,
        uint256 indexed channelID,
        string attributes,
        string document
    );

    // contentID: find content sequence
    // channelID: generate channel timeline
    // sequenceNum: lookup based on ordering
    event Sequence (
        uint256 indexed channelID,
        uint256 indexed channelIndex,
        uint256 indexed overallIndex,
        uint256 contentID
    );

    uint256 private overallSize;
    mapping(uint256 => uint256) private channelSize;
    mapping(uint256 => Content) private contents;

    function() public { throw; }

    function Publisher() public { }

    function publish(string channelName, string attributes, string document, address indexer) {
        uint256 channelID = getChannelByName(channelName);
        uint256 contentID = uint256(sha256(msg.sender, channelID, attributes, document));
        if (contents[contentID].timestamp != 0) {
            // content id collision
            throw;
        }

        contents[contentID] = Content({
            accountID: msg.sender,
            channelID: channelID,
            timestamp: block.timestamp
        });

        Store(
            contentID,
            msg.sender,
            channelID,
            attributes,
            document
        );

        Publish(
            contentID,
            msg.sender,
            channelID,
            attributes,
            bytes(document).length,
            block.timestamp
        );

        Sequence(channelID, channelSize[channelID]++, overallSize++, contentID);

        Indexer(indexer).index(contentID, msg.sender, channelID, block.timestamp);
    }

    function getOverallSize() constant returns (uint256) {
        return overallSize;
    }
    function getChannelSize(uint256 channelID) constant returns (uint256) {
        return channelSize[channelID];
    }
    function getContentAccount(uint256 contentID) constant returns (address) {
        return contents[contentID].accountID;
    }
    function getContentChannel(uint256 contentID) constant returns (uint256) {
        return contents[contentID].channelID;
    }
    function getContentTimestamp(uint256 contentID) constant returns (uint256) {
        return contents[contentID].timestamp;
    }
    function getChannelByName(string str) constant returns (uint256 channelID) {
        bytes memory raw = bytes(str);
        // Limit channels to [3, 30] chars
        if (raw.length < 3 || raw.length > 30) {
            throw;
        }
        for (uint256 i = 0; i < raw.length; i++) {
            uint8 c = uint8(raw[i]);
            if (
                (c >= 48 && c <= 57) || // [0-9]
                (c >= 97 && c <= 122) || // [a-z]
                c == 95 // [_]
            ) {
                // Shift by 1 byte (*2^8) and add char
                channelID *= 256;
                channelID += c;
            }
            else if (c >= 65 && c <= 90) { // [A-Z]
                // Shift by 1 byte (*2^8) and add lowercase char
                channelID *= 256;
                channelID += c + 32; // 32 = a - A
            }
            else {
                throw;
            }
        }
        return channelID;
    }
    function getContentByData(address accountID, uint256 channelID, string attributes, string document) constant returns (uint256) {
        return uint256(sha256(accountID, channelID, attributes, document));
    }
}
