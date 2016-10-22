pragma solidity ^0.4.2;

import "Indexer.sol";

contract CredSign {

    uint256 public constant CRED = 10**16; // 0.01eth

    struct Content {
        address accountID;
        uint256 parentID;
        uint256 channelID;
        uint256 timestamp;
        mapping(address => mapping(address => uint256)) indexedAccountCred;
    }

    // contentID: fetch document metadata
    // accountID: generate profile
    // parentID: fetch responses
    event Post (
        uint256 indexed contentID,
        address indexed accountID,
        uint256 indexed parentID,
        uint256 channelID,
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
        uint256 indexed nonce,
        uint256 parentID,
        uint256 channelID,
        string attributes,
        string document
    );

    // contentID: filter on post
    // accountID: generate profile
    // indexer: filter on post
    event Sign (
        uint256 indexed contentID,
        address indexed accountID,
        address indexed indexer,
        uint256 channelID,
        uint256 oldCred,
        uint256 newCred,
        uint256 timestamp
    );

    // contentID: find content sequence
    // channelID: generate channel timeline
    // sequenceNum: lookup based on ordering
    event ChannelSequence (
        uint256 indexed contentID,
        uint256 indexed channelID,
        uint256 indexed sequenceNum
    );

    mapping(uint256 => uint256) private channelSequenceNum;
    mapping(uint256 => Content) private contents;

    function() public { throw; }

    function CredSign() public { }

    function post(string channelName, string attributes, string document, uint256 nonce, uint256 parentID, address indexer) {
        uint256 channelID = getChannelByName(channelName);
        uint256 contentID = uint256(sha256(msg.sender, nonce, parentID, channelID, attributes, document));
        Content content = contents[contentID];
        if (content.accountID != 0) {
            // Content already exists
            throw;
        }
        content.accountID = msg.sender;
        content.channelID = channelID;
        content.parentID = parentID;
        content.timestamp = block.timestamp;

        Store(
            contentID,
            msg.sender,
            nonce,
            parentID,
            channelID,
            attributes,
            document
        );

        Post(
            contentID,
            msg.sender,
            parentID,
            channelID,
            attributes,
            bytes(document).length,
            block.timestamp
        );

        ChannelSequence(contentID, channelID, ++channelSequenceNum[channelID]);

        Indexer(indexer).index(contentID, msg.sender, 0, 0);
    }

    function sign(uint256 contentID, uint256 newCred, address indexer) payable {
        Content content = contents[contentID];
        if (content.accountID == 0) {
            // Content does not exist
            throw;
        }

        uint256 oldCred = content.indexedAccountCred[indexer][msg.sender];
        uint256 txnCred = (msg.value - (msg.value % CRED)) / CRED;
        if (oldCred + txnCred < newCred) {
            // Insufficient funds to sign desired amount
            throw;
        }

        Sign(
            contentID,
            msg.sender,
            indexer,
            content.channelID,
            oldCred,
            newCred,
            block.timestamp
        );

        content.indexedAccountCred[indexer][msg.sender] = newCred;

        Indexer(indexer).index(contentID, msg.sender, oldCred, newCred);

        // Refund excess funds
        uint256 refund = msg.value % CRED;
        if (oldCred + txnCred > newCred) {
            refund += (oldCred + txnCred - newCred) * CRED;
        }
        if (refund > 0 && !msg.sender.send(refund)) {
            throw;
        }
    }

    // ----- CHANNEL DATA
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

    function getContentIndexedAccountCred(uint256 contentID, address indexer, address accountID) constant returns (uint256) {
        return contents[contentID].indexedAccountCred[indexer][accountID];
    }
    function getContentAccount(uint256 contentID) constant returns (address) {
        return contents[contentID].accountID;
    }
    function getContentParent(uint256 contentID) constant returns (uint256) {
        return contents[contentID].parentID;
    }
    function getContentChannel(uint256 contentID) constant returns (uint256) {
        return contents[contentID].channelID;
    }
    function getContentTimetamp(uint256 contentID) constant returns (uint256) {
        return contents[contentID].timestamp;
    }
    function getNumContents(uint256 channelID) constant returns (uint256) {
        return channelSequenceNum[channelID];
    }
}
