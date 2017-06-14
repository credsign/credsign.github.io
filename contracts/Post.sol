pragma solidity ^0.4.3;

import './Feed.sol';

/// @title Post log-storage implementation.
contract Post {

    /// @param contentID The unique contentID generated for this content.
    /// @param publisher The address the content was published from.
    /// @param token The channel this content is published to.
    /// @param headers Content metadata including body format.
    /// @param document Blob of data containing the published body.
    /// @param parentID The id of the content this post responds to.
    /// @param timestamp Time the content was published
    event Content (
        bytes32 indexed contentID,
        address indexed publisher,
        address indexed token,
        string headers,
        string document,
        bytes32 parentID,
        uint256 timestamp
    );

    address public owner;
    address public feedAPI;

    function Post(address feedContract) {
        owner = msg.sender;
        feedAPI = feedContract;
    }

    /// @param headers Custom Mime-like headers delimited by newlines.
    /// @param document Blob of data containing the published content.
    /// @param token The channel this post is published in.
    /// @param parentID The contentID this post is in response to.
    function publish(string headers, string document, address token, bytes32 parentID) {

        bytes32 contentID = toContentID(msg.sender, headers, document, token, parentID);

        if (parentID == 0) {
            if (!Feed(feedAPI).post(msg.sender, token, contentID)) {
                throw;
            }
        }
        else {
            if (!Feed(feedAPI).reply(msg.sender, token, contentID, parentID)) {
                throw;
            }
        }

        // Save post to log storage
        Content(
            contentID,
            msg.sender,
            token,
            headers,
            document,
            parentID,
            block.timestamp
        );

    }

    /// @dev Reject any funds sent directly to the contract
    function() public {
        throw;
    }

    /// @dev Generate a deterministic contentID from the content data.
    /// @param publisher The address the content is published from.
    /// @param headers Custom Mime-like headers delimited by newlines.
    /// @param document Blob of data containing the published content.
    /// @param token The channel the content will be posted into.
    /// @param parentID The id of the replied-to content.
    /// @return contentID A keccak256 digest of the publishing params.
    function toContentID(address publisher, string headers, string document, address token, bytes32 parentID) constant returns (bytes32) {
        return keccak256(publisher, headers, document, token, parentID);
    }
}
