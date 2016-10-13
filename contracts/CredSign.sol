pragma solidity ^0.4.2;

import "IterableSet.sol";
import "RankingTree.sol";

contract CredSign {

    uint256 public constant CRED = 10**16; // 0.01eth

    struct Channel {
        uint256 cred;
        RankingTree.Tree rankedContents;
    }

    struct Content {
        uint256 cred;
        uint256 channelID;
    }

    struct User {
        IterableSet.Set signedContents;
        IterableSet.Set fundedContents;
        mapping(uint256 => uint256) contentCred;
    }

    event Store (
        uint256 indexed contentID,
        address indexed publisher,
        uint256 indexed channelID,
        string title,
        string body,
        uint256 timestamp
    );

    event Post (
        address indexed publisher,
        uint256 indexed channelID,
        uint256 indexed feedIndex,
        uint256 contentID,
        uint256 timestamp
    );

    event Sign (
        address indexed signatory,
        uint256 indexed contentID,
        uint256 indexed channelID,
        uint256 timestamp
    );

    uint256 totalCred;
    RankingTree.Tree rankedChannels;
    mapping(uint256 => Channel) private channels;
    mapping(uint256 => Content) private contents;
    mapping(address => User) private users;

    function() public { throw; }

    function CredSign() public { }

    function post(string channelName, string title, string body) payable {
        uint256 channelID = this.getChannelByName(channelName);
        uint256 contentID = uint256(sha256(msg.sender, channelID, title, body, block.timestamp));

        if (bytes(channelName).length < 3|| bytes(title).length < 3 || bytes(body).length < 3 || channelID == 0) {
            // failed validation
            throw;
        }
        contents[contentID].channelID = channelID;
        Channel channel = channels[channelID];

        // Consider IPFS for storage once it uses Ethereum
        Store(
            contentID,
            msg.sender,
            channelID,
            title,
            body,
            block.timestamp
        );

        Post(
            msg.sender,
            channelID,
            RankingTree.size(channel.rankedContents),
            contentID,
            block.timestamp
        );

        RankingTree.insert(channel.rankedContents, 0, contentID);
        RankingTree.insert(rankedChannels, channel.cred, channelID);
    }

    // TODO: Allow multiple signs/voids in 1 txn
    function sign(uint256 contentID, uint cred) payable {
        Content content = contents[contentID];
        if (content.channelID == 0) {
            // Content does not exist
            throw;
        }
        Channel channel = channels[content.channelID];

        User user = users[msg.sender];
        uint256 oldCred = user.contentCred[contentID];
        uint256 remainder = msg.value % CRED;
        uint256 sentCred = (msg.value - remainder) / CRED;

        if (cred > oldCred + sentCred) {
            // Not enough cred to sign
            throw;
        }
        else if (oldCred > cred) {
            remainder += (oldCred - cred) * CRED;
        }

        // Rerank the content in the channel
        RankingTree.remove(channel.rankedContents, content.cred, contentID);
        content.cred += cred - oldCred;
        RankingTree.insert(channel.rankedContents, content.cred, contentID);

        // Rerank the channel overall
        RankingTree.remove(rankedChannels, channel.cred, content.channelID);
        channel.cred += cred - oldCred;
        RankingTree.insert(rankedChannels, channel.cred, content.channelID);

        totalCred += cred - oldCred;

        // Set the new signature amount
        user.contentCred[contentID] = cred;

        if (cred > 0) {
            IterableSet.insert(user.fundedContents, contentID);
        }
        else {
            IterableSet.remove(user.fundedContents, contentID);
        }

        // Emit the signed event if not previously signed
        if (IterableSet.insert(user.signedContents, contentID)) {
            Sign(
                msg.sender,
                contentID,
                content.channelID,
                block.timestamp
            );
        }

        // Refund back amounts owned by sender
        if (remainder > 0) {
            if (!msg.sender.send(remainder)) {
                throw;
            }
        }
    }

    function getTotalCred() external constant returns (uint256) {
        return totalCred;
    }

    // ----- CHANNEL DATA
    function getChannelByName(string str) external constant returns (uint256 num) {
        bytes memory raw = bytes(str);
        // Limit strings to 25char
        if (raw.length < 25) {
            for (uint256 i = 0; i < raw.length; i++) {
                uint8 c = uint8(raw[i]);
                if (
                    (c >= 48 && c <= 57) || // [0-9]
                    (c >= 97 && c <= 122) || // [a-z]
                    c == 95 // [_]
                ) {
                    // Shift by 1 byte (*2^8) and add char
                    num *= 256;
                    num += c;
                }
                else if (c >= 65 && c <= 90) { // [A-Z]
                    // Shift by 1 byte (*2^8) and add lowercase char
                    num *= 256;
                    num += c + 32; // 32 = a - A
                }
                else {
                    num = 0;
                    break;
                }
            }
        }
        return num;
    }
    function getChannelByRank(uint256 rank) external constant returns (uint256, uint256) {
        return RankingTree.getValueByRank(rankedChannels, rank);
    }
    function getChannelCred(uint256 channelID) external constant returns (uint256) {
        return channels[channelID].cred;
    }
    function getChannelRank(uint256 channelID) external constant returns (uint256) {
        return RankingTree.getRankByKeyValue(
            rankedChannels,
            channels[channelID].cred,
            channelID
        );
    }
    function getNumChannels() external constant returns (uint256) {
        return RankingTree.size(rankedChannels);
    }

    // ----- CONTENT DATA
    function getContentCred(uint256 contentID) external constant returns (uint256) {
        return contents[contentID].cred;
    }
    function getContentCredSignedByUser(address userAddress, uint256 contentID) external constant returns (uint256) {
        return users[userAddress].contentCred[contentID];
    }
    function getContentRank(uint256 contentID) external constant returns (uint256) {
        return RankingTree.getRankByKeyValue(
            channels[contents[contentID].channelID].rankedContents,
            contents[contentID].cred,
            contentID
        );
    }
    function getContentByRank(uint256 rank, uint256 channelID) external constant returns (uint256, uint256) {
        return RankingTree.getValueByRank(channels[channelID].rankedContents, rank);
    }
    function getNumContents(uint256 channelID) external constant returns (uint256) {
        return RankingTree.size(channels[channelID].rankedContents);
    }
    function getNumContentsFundedByUser(address userAddress) external constant returns (uint256) {
        return IterableSet.size(users[userAddress].fundedContents);
    }
    function getNextContentFundedByUser(address userAddress, uint256 contentID) external constant returns (uint256) {
        return IterableSet.next(users[userAddress].fundedContents, contentID);
    }
}
