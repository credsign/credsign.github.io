pragma solidity ^0.4.2;

import "Indexer.sol";
import "CredSign.sol";
import "RankingTree.sol";
import "IterableSet.sol";

contract CredRank is Indexer {

    struct Source {
        uint256 cred;
        RankingTree.Tree channelRankings;
        mapping(uint256 => Channel) channels;
        mapping(uint256 => Content) contents;
    }

    struct Channel {
        uint256 cred;
        RankingTree.Tree contentRankings;
    }

    struct Content {
        uint256 cred;
    }

    mapping(address => Source) sources;

    function index(uint256 contentID, address accountID, uint256 oldCred, uint256 newCred) {
        Source source = sources[msg.sender];
        uint256 channelID = CredSign(msg.sender).getContentChannel(contentID);
        Channel channel = source.channels[channelID];
        Content content = source.contents[contentID];

        if (oldCred != newCred) {
            // Rerank the content in the channel
            RankingTree.remove(channel.contentRankings, content.cred, contentID);
            content.cred += newCred - oldCred;
            RankingTree.insert(channel.contentRankings, content.cred, contentID);

            // Rerank the channel overall
            RankingTree.remove(source.channelRankings, channel.cred, channelID);
            channel.cred += newCred - oldCred;
            RankingTree.insert(source.channelRankings, channel.cred, channelID);

            source.cred += newCred - oldCred;
        }
        else if (newCred == 0) {
            // Ensure the content gets ranked if it isn't already
            RankingTree.insert(source.channelRankings, channel.cred, channelID);
            RankingTree.insert(channel.contentRankings, content.cred, contentID);
        }
    }

    function getChannelByRank(address sourceID, uint256 rank) constant returns (uint256, uint256) {
        return RankingTree.getValueByRank(
            sources[sourceID].channelRankings,
            rank
        );
    }
    function getChannelCred(address sourceID, uint256 channelID) constant returns (uint256) {
        return sources[sourceID].channels[channelID].cred;
    }
    function getChannelRank(address sourceID, uint256 channelID) constant returns (uint256) {
        return RankingTree.getRankByKeyValue(
            sources[sourceID].channelRankings,
            sources[sourceID].channels[channelID].cred,
            channelID
        );
    }
    function getNumChannels(address sourceID) constant returns (uint256) {
        return RankingTree.size(sources[sourceID].channelRankings);
    }

    function getContentCred(address sourceID, uint256 contentID) constant returns (uint256) {
        return sources[sourceID].contents[contentID].cred;
    }
    function getContentRank(address sourceID, uint256 contentID) constant returns (uint256) {
        return RankingTree.getRankByKeyValue(
            sources[sourceID].channels[CredSign(sourceID).getContentChannel(contentID)].contentRankings,
            sources[sourceID].contents[contentID].cred,
            contentID
        );
    }
    function getContentByRank(address sourceID, uint256 channelID, uint256 rank) constant returns (uint256, uint256) {
        return RankingTree.getValueByRank(
            sources[sourceID].channels[channelID].contentRankings,
            rank
        );
    }
    function getNumContents(address sourceID, uint256 channelID) constant returns (uint256) {
        return RankingTree.size(sources[sourceID].channels[channelID].contentRankings);
    }

    // ----- BATCH APIS
    // Generate the channel leaderboard
    function getChannelsByRanks(address sourceID, uint256 startRank, uint256 endRank) public constant returns (uint256[], uint256[], uint256[]) {
        if (startRank == 0 || endRank < startRank || endRank > getNumChannels(sourceID)) {
            throw;
        }
        uint256 numResults = 1 + endRank - startRank;
        Source source = sources[sourceID];

        uint256[] memory channelIDs = new uint256[](numResults);
        uint256[] memory channelCred = new uint256[](numResults);
        uint256[] memory channelRanks = new uint256[](numResults);

        for (uint256 i = 0; i < numResults; i++) {
            (channelIDs[i], channelRanks[i]) = getChannelByRank(sourceID, startRank + i);
            channelCred[i] = getChannelCred(sourceID, channelIDs[i]);
        }
        return (channelIDs, channelCred, channelRanks);
    }

    // Generate the content leaderboard
    function getContentsByRanks(address sourceID, uint256 channelID, uint256 startRank, uint256 endRank) public constant returns (uint256[], uint256[], uint256[]) {
        if (startRank == 0 || endRank < startRank || endRank > getNumContents(sourceID, channelID)) {
            throw;
        }
        uint256 numResults = 1 + endRank - startRank;

        uint256[] memory contentIDs = new uint256[](numResults);
        uint256[] memory contentCred = new uint256[](numResults);
        uint256[] memory contentRanks = new uint256[](numResults);

        for (uint256 i = 0; i < numResults; i++) {
            (contentIDs[i], contentRanks[i]) = getContentByRank(sourceID, channelID, startRank + i);
            contentCred[i] = getContentCred(sourceID, contentIDs[i]);
        }
        return (contentIDs, contentCred, contentRanks);
    }

    // Get the cred and rank for an arbitrary array of contents
    function getCredRanksByContents(address sourceID, uint256[] contentIDs) public constant returns (uint256[], uint256[]) {
        uint256[] memory contentCred = new uint256[](contentIDs.length);
        uint256[] memory contentRanks = new uint256[](contentIDs.length);

        for (uint256 i = 0; i < contentIDs.length; i++) {
            contentCred[i] = getContentCred(sourceID, contentIDs[i]);
            contentRanks[i] = getContentRank(sourceID, contentIDs[i]);
        }
        return (contentCred, contentRanks);
    }
}
