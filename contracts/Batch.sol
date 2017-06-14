pragma solidity ^0.4.3;

import './Feed.sol';

contract Batch {

    Feed private feed;

    function Batch(address feedContract) {
        feed = Feed(feedContract);
    }

    function _getContent(bytes32 contentID) constant returns (address, address, address, uint40, uint16, uint256) {
        address api;
        address publisher;
        address token;
        uint40 IGNORE;
        uint40 postBlock;
        uint16 replyCount;
        uint256 tipped;

        (   api,
            publisher,
            token,
            IGNORE,
            IGNORE,
            postBlock,
            replyCount,
            tipped
        ) = feed.getContent(contentID);

        return (api, publisher, token, postBlock, replyCount, tipped);
    }

    function getContents(bytes32[] contentIDs) constant returns (address[], address[], address[], uint40[], uint16[], uint256[]) {
        address[] memory apis = new address[](contentIDs.length);
        address[] memory publishers = new address[](contentIDs.length);
        address[] memory tokens = new address[](contentIDs.length);
        uint40[] memory blocks = new uint40[](contentIDs.length);
        uint16[] memory replies = new uint16[](contentIDs.length);
        uint256[] memory tips = new uint256[](contentIDs.length);

        for (uint256 i = 0; i < contentIDs.length; i++) {
            (   apis[i],
                publishers[i],
                tokens[i],
                blocks[i],
                replies[i],
                tips[i]
            ) = _getContent(contentIDs[i]);
        }
        return (apis, publishers, tokens, blocks, replies, tips);
    }


}
