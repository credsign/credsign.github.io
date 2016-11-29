pragma solidity ^0.4.3;

import "../Index.sol";
import "../Content.sol";

/// @title ContentSeries Index content in the order it is published.
contract ContentSeries is Index {

    /// @dev Series Store the index in the transaction logs.
    /// @param contentID The ID corresponding to the content.
    /// @param seriesNum A zero-based, chronological index of all content.
    event Series (
        uint256 indexed contentID,
        uint256 indexed seriesNum,
        uint256 timestamp
    );

    uint256 private contentSize;
    Content private content;

    /// @dev ContentSeries Construct a new content series index.
    /// @param contentContract Contract address where content gets published.
    function ContentSeries(address contentContract) {
        content = Content(contentContract);
    }

    /// @dev Add the contentID to this index.
    /// @param contentID the contentID for a piece of published content.
    function add(uint256 contentID) {
        if (msg.sender != address(content)) {
            throw;
        }
        Series(contentID, contentSize++, block.timestamp);
    }

    /// @dev Get the number of indexed content.
    /// @return The number of indexed content.
    function getSize() constant returns (uint256) {
        return contentSize;
    }

    /// @dev Reject any funds sent to the contract
    function() public {
        throw;
    }
}
