pragma solidity ^0.4.3;

import './Fund.sol';
import './Token.sol';

/// @title Feeds for publishing and tipping.
contract Feed {

    struct Account {
        uint40 publisherID;
        uint40 lastPostPublishedBlock;
        uint40 lastReplyPublishedBlock;
        uint40 lastReplyReceivedBlock;
        uint40 lastTipSentBlock;
        uint40 lastTipRecievedBlock;
        address depositAddress;
        mapping(address => uint256) balances;
    }

    struct Channel {
        uint40 tokenID;
        uint40 lastPostBlock;
        uint40 postCount;
    }

    struct Content {
        uint40 apiID;
        uint40 publisherID;
        uint40 tokenID;
        uint40 lastReplyBlock;
        uint40 lastTipBlock;
        uint40 postBlock;
        uint16 replyCount;
        uint256 tipped;
        mapping(address => uint256) tips;
    }

    mapping(address => uint40) private apiIDs;

    mapping(address => Account) private accounts;
    mapping(address => Channel) private channels;
    mapping(bytes32 => Content) private contents;

    mapping(uint40 => address) public apis;
    mapping(uint40 => address) public publishers;
    mapping(uint40 => address) public tokens;

    uint40 public apiCount;
    uint40 public publisherCount;
    uint40 public tokenCount;

    address public admin;
    uint256 public fee;

    event Post (
        address indexed publisher,
        address indexed token,
        bytes32 indexed contentID,
        uint256 timestamp,
        uint40 prevPublisherPostBlock,  // publisher series
        uint40 prevTokenPostBlock       // channel series
    );

    event Reply (
        address indexed publisher,
        address indexed parentPublisher,
        bytes32 indexed parentContentID,
        address token,
        bytes32 contentID,
        uint256 timestamp,
        uint40 prevPublisherReplyBlock,     // publisher reply series
        uint40 prevReplyToPublisherBlock,   // replies to publisher series
        uint40 prevReplyToContentBlock      // replies to content series
    );

    event Tip (
        address indexed sender,
        address indexed recipient,
        bytes32 indexed contentID,
        address token,
        uint256 amount,
        uint256 adminFee,
        uint256 timestamp,
        uint40 prevSenderBlock,     // user tips earned series
        uint40 prevRecipientBlock,  // user tips given series
        uint40 prevContentBlock     // post tips series
    );

    modifier onlyAdmin() {
        if (msg.sender != admin) {
            throw;
        }
        _;
    }

    modifier hasBalance(address token, uint value) {
        Account account = accounts[msg.sender];

        // Credit ether
        if (msg.value > 0) {
            account.balances[0x1] += msg.value;
        }

        if (account.depositAddress != 0 && account.balances[token] < value) {
            // Sweep the deposit address
            account.balances[token] += Fund(account.depositAddress).claim(token);
        }

        // Final balance check
        if (account.balances[token] < value) {
            throw;
        }
        _;
    }

    function Feed() {
        // Add Ether, with address 0x1
        tokens[0x1] = channels[0x1].tokenID = ++tokenCount;

        admin = msg.sender;
        fee = 0; // 100% = 1000000
    }

    /// @param publisher Address of the person publishing.
    /// @param token The channel this post is published in.
    /// @param contentID The contentID of this post.
    function post(address publisher, address token, bytes32 contentID) returns (bool success) {

        Account account = accounts[publisher];
        Channel channel = channels[token];
        Content content = contents[contentID];

        uint40 apiID = apiIDs[msg.sender];
        uint40 publisherID = account.publisherID;
        uint40 tokenID = channel.tokenID;

        if (apiID == 0 || tokenID == 0) {
            throw; // inactive api, or invalid token
        }

        if (publisherID == 0) {
            publishers[++publisherCount] = publisher;
            account.publisherID = publisherID = publisherCount;
        }

        content.apiID = apiID;
        content.publisherID = publisherID;
        content.tokenID = tokenID;

        Post(
            publisher,
            token,
            contentID,
            block.timestamp,
            account.lastPostPublishedBlock,
            channel.lastPostBlock
        );

        uint40 blockNumber = uint40(block.number);
        account.lastPostPublishedBlock = blockNumber;
        channel.lastPostBlock = blockNumber;
        channel.postCount++;
        content.postBlock = blockNumber;

        return true;
    }

    function reply(address publisher, address token, bytes32 contentID, bytes32 parentID) returns (bool success) {
        Account account = accounts[publisher];
        Content content = contents[contentID];
        Content parentContent = contents[parentID];
        Account parentAccount = accounts[parentContent.publisherID];

        uint40 apiID = apiIDs[msg.sender];
        uint40 publisherID = account.publisherID;
        uint40 tokenID = channels[token].tokenID;

        if (apiID == 0 || tokenID == 0 || tokenID != parentContent.tokenID) {
            throw; // inactive api, invalid token, or token mismatch
        }

        if (publisherID == 0) {
            // First time publishing
            publishers[++publisherCount] = publisher;
            account.publisherID = publisherID = publisherCount;
        }

        content.apiID = apiID;
        content.publisherID = publisherID;
        content.tokenID = tokenID;

        Reply(
            publisher,
            publishers[parentContent.publisherID],
            parentID,
            token,
            contentID,
            block.timestamp,
            account.lastReplyPublishedBlock,
            parentAccount.lastReplyReceivedBlock,
            parentContent.lastReplyBlock
        );

        uint40 blockNumber = uint40(block.number);
        account.lastReplyPublishedBlock = blockNumber;
        content.postBlock = blockNumber;
        parentAccount.lastReplyReceivedBlock = blockNumber;
        parentContent.lastReplyBlock = blockNumber;
        parentContent.replyCount++;

        return true;
    }

    function tip(bytes32 contentID, address token, uint256 value) hasBalance(token, value) payable returns (bool success) {
        Content content = contents[contentID];
        if (content.postBlock == 0 || content.tokenID != channels[token].tokenID || value == 0) {
            throw; // Invalid tip request
        }

        accounts[msg.sender].balances[token] -= value;

        uint256 adminFee = value * fee / 1000000;
        accounts[admin].balances[token] += adminFee;

        address recipient = publishers[content.publisherID];
        accounts[recipient].balances[token] += value - adminFee;

        content.tips[msg.sender] += value;
        content.tipped += value;

        Tip(
            msg.sender,
            recipient,
            contentID,
            token,
            value,
            adminFee,
            block.timestamp,
            accounts[msg.sender].lastTipSentBlock,
            accounts[recipient].lastTipRecievedBlock,
            content.lastTipBlock
        );

        accounts[msg.sender].lastTipSentBlock = uint40(block.number);
        accounts[recipient].lastTipRecievedBlock = uint40(block.number);
        content.lastTipBlock = uint40(block.number);

        return true;
    }

    function setupDeposits() returns (bool success) {
        Account account = accounts[msg.sender];
        if (account.depositAddress != 0) {
            throw;
        }
        // TODO: use forwarder contracts (50k gas)
        account.depositAddress = address(new Fund());
        return true;
    }

    function withdraw(address token, uint value) hasBalance(token, value) returns (bool success) {
        Account account = accounts[msg.sender];
        account.balances[token] -= value;
        if (token == 0x1) {
            if (!msg.sender.send(value)) {
                throw;
            }
        }
        else {
            if (!Token(token).transfer(msg.sender, value)) {
                throw;
            }
        }
        return true;
    }

    function disableApi(address api) onlyAdmin returns (bool success) {
        if (apiIDs[api] == 0) {
            throw;
        }
        // don't modify apis[] because we don't want to break old pointers
        apiIDs[api] = 0;
        return true;
    }

    function enableApi(address api) onlyAdmin returns (bool success) {
        if (apiIDs[api] == 0) {
            apiIDs[api] = ++apiCount;
            apis[apiCount] = api;
        }
        return true;
    }

    function addToken(address token) onlyAdmin returns (bool success) {
        Channel channel = channels[token];
        if (channel.tokenID != 0) {
            throw; // token already listed
        }
        channel.tokenID = ++tokenCount;
        tokens[channel.tokenID] = token;
        return true;
    }

    function setFee(uint256 newFee) onlyAdmin returns (bool success) {
        if (newFee > 1000000) {
            throw; // can't be > 100%
        }
        fee = newFee;
        return true;
    }

    /// @dev Reject any funds sent directly to the contract
    function() public {
        throw;
    }

    function getContent(bytes32 contentID) constant returns (address, address, address, uint40, uint40, uint40, uint16, uint256) {
        Content content = contents[contentID];
        return (
            apis[content.apiID],
            publishers[content.publisherID],
            tokens[content.tokenID],
            content.lastReplyBlock,
            content.lastTipBlock,
            content.postBlock,
            content.replyCount,
            content.tipped
        );
    }

    function getChannel(address token) constant returns (uint40, uint40) {
        Channel channel = channels[token];
        return (
            channel.lastPostBlock,
            channel.postCount
        );
    }

    function getAccount(address user) constant returns (uint40, uint40, uint40, uint40, uint40, address) {
        Account account = accounts[user];
        return (
            account.lastPostPublishedBlock,
            account.lastReplyPublishedBlock,
            account.lastReplyReceivedBlock,
            account.lastTipSentBlock,
            account.lastTipRecievedBlock,
            account.depositAddress
        );
    }

    function getChannelPostCount(address token) constant returns (uint256) {
        return channels[token].postCount;
    }

    function getContentTip(bytes32 contentID, address user) constant returns (uint256) {
        return contents[contentID].tips[user];
    }

    function getDepositAddress(address user) constant returns (address) {
        return accounts[user].depositAddress;
    }

    function getTokenBalance(address user, address token) constant returns (uint256) {
        Account account = accounts[user];
        uint256 balance = account.balances[token];
        if (account.depositAddress > 0) {
            if (token == 0x1) {
                balance += account.depositAddress.balance;
            }
            else {
                balance += Token(token).balanceOf(account.depositAddress);
            }
        }
        return balance;
    }

}
