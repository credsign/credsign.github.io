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

    struct Account {
        IterableSet.Set fundedContents;
        mapping(uint256 => uint256) signedCred;
    }

    event Store (
        uint256 indexed contentID,
        address indexed publisher,
        uint256 indexed channelID,
        string title,
        string body,
        uint256 timestamp
    );

    event Publish (
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
        uint256 accountCred,
        uint256 contentCred,
        uint256 channelCred,
        uint256 timestamp
    );

    RankingTree.Tree rankedChannels;
    mapping(uint256 => Channel) private channels;
    mapping(uint256 => Content) private contents;
    mapping(address => Account) private accounts;

    function() public { throw; }

    function CredSign() public { }

    function publish(string channelName, string title, string body) payable {
        uint256 channelID = this.getChannelByName(channelName);
        uint256 contentID = uint256(sha256(msg.sender, channelID, title, body, block.timestamp));

        if (channelID == 0 || bytes(title).length < 10 || bytes(title).length > 100) {
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

        Publish(
            msg.sender,
            channelID,
            RankingTree.size(channel.rankedContents),
            contentID,
            block.timestamp
        );

        if (msg.value > 0) {
            sign(contentID, (msg.value - (msg.value % CRED)) / CRED);
        }
        else {
            RankingTree.insert(channel.rankedContents, 0, contentID);
            RankingTree.insert(rankedChannels, channel.cred, channelID);
        }
    }

    function sign(uint256 contentID, uint256 cred) payable {
        uint256 channelID = contents[contentID].channelID;
        if (channelID == 0) {
            // Content does not exist
            throw;
        }
        Account account = accounts[msg.sender];
        Content content = contents[contentID];
        Channel channel = channels[channelID];

        uint256 oldCred = account.signedCred[contentID];
        uint256 sentCred = (msg.value - (msg.value % CRED)) / CRED;

        if (oldCred + sentCred < cred) {
            // Insufficient funds to sign desired amount
            throw;
        }

        // Track the funds stored in the account's account
        account.signedCred[contentID] = cred;
        if (cred > 0) {
            IterableSet.insert(account.fundedContents, contentID);
        }
        else {
            IterableSet.remove(account.fundedContents, contentID);
        }

        // Rerank the content in the channel
        RankingTree.remove(channel.rankedContents, content.cred, contentID);
        content.cred += cred - oldCred;
        RankingTree.insert(channel.rankedContents, content.cred, contentID);

        // Rerank the channel overall
        RankingTree.remove(rankedChannels, channel.cred, channelID);
        channel.cred += cred - oldCred;
        RankingTree.insert(rankedChannels, channel.cred, channelID);

        Sign(
            msg.sender,
            contentID,
            channelID,
            cred,
            content.cred,
            channel.cred,
            block.timestamp
        );

        // Send the account back any excess
        uint256 remainder = msg.value % CRED;
        if (oldCred + sentCred > cred) {
            remainder += (oldCred + sentCred - cred) * CRED;
        }
        if (remainder > 0) {
            if (!msg.sender.send(remainder)) {
                throw;
            }
        }
    }

    // ----- CHANNEL DATA
    function getChannelByName(string str) external constant returns (uint256 num) {
        bytes memory raw = bytes(str);
        // Limit channels to [3, 30] chars
        if (raw.length >= 3 && raw.length <= 30) {
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
    function getContentCredSignedByAccount(address account, uint256 contentID) external constant returns (uint256) {
        return accounts[account].signedCred[contentID];
    }
    function getNumContents(uint256 channelID) external constant returns (uint256) {
        return RankingTree.size(channels[channelID].rankedContents);
    }
    function getNumContentsFundedByAccount(address account) external constant returns (uint256) {
        return IterableSet.size(accounts[account].fundedContents);
    }
    function getNextContentFundedByAccount(address account, uint256 contentID) external constant returns (uint256) {
        return IterableSet.next(accounts[account].fundedContents, contentID);
    }
}
