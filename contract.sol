contract CredSign {

    uint256 public constant CRED = 10**16; // 0.01eth

    uint8 private constant ZERO = 48;
    uint8 private constant NINE = 57;
    uint8 private constant UPPERCASE_A = 65;
    uint8 private constant UPPERCASE_Z = 90;
    uint8 private constant UNDERSCORE = 95;
    uint8 private constant LOWERCASE_A = 97;
    uint8 private constant LOWERCASE_Z = 122;

    uint256 private constant NULL = 0;

    struct Post {
        uint256 channelID;
        uint256 cred;
        mapping(address => uint256) signatures;
    }

    struct CredRank {
        uint256 cred;
        uint256 size;
        Tree tree;
    }

    struct Tree {
        // (2 ** 37) - 1; 137,438,953,471 elts; range [0..1,374,389,534.70] ether
        Node[137438953471] nodes;
    }

    struct Node {
        uint256 numAt;
        uint256 numLeft;
        uint256 numRight;
        LinkedSet values;
    }

    struct LinkedSet {
        uint256 last;
        // Each value points to the prev/next value
        // Value of NULL(0) indicates of set
        mapping(uint256 => uint256) prev;
        mapping(uint256 => uint256) next;
    }

    event ChannelCreate (
        uint256 indexed channelID,
        string channelName,
        uint256 timestamp
    );

    event PostCreate (
        address indexed sourceAddress,
        uint256 indexed channelID,
        uint256 indexed postID,
        string channelName,
        string title,
        string body,
        uint256 timestamp
    );

    event PostSign (
        address indexed sourceAddress,
        uint256 indexed channelID,
        uint256 indexed postID,
        uint256 cred,
        uint256 timestamp
    );

    event SignatureVoid (
        address indexed sourceAddress,
        uint256 indexed channelID,
        uint256 indexed postID,
        uint256 cred,
        uint256 timestamp
    );

    CredRank private channelRank;
    mapping(uint256 => CredRank) private postRanks;
    mapping(uint256 => Post) private posts;

    function() public { throw; }

    function CredSign() public { }

    function CreatePost(string channelName, string title, string body) public {
        uint256 channelID = GetChannelID(channelName);
        if (channelID == 0) {
            throw;
        }
        channelName = GetChannelName(channelID); // normalize casing
        CredRank postRank = postRanks[channelID];
        if (postRank.size++ == 0) {
            channelRank.size++;
            ChannelCreate(
                channelID,
                channelName,
                block.timestamp
            );
        }
        uint256 postID = uint256(sha3(channelName, title, body, block.timestamp));

        posts[postID].channelID = channelID;

        PostCreate(
            msg.sender,
            channelID,
            postID,
            channelName,
            title,
            body,
            block.timestamp
        );

        if (msg.value != NULL) {
            SignPost(postID);
        }
    }

    function SignPost(uint256 postID) public {
        Post post = posts[postID];
        if (post.channelID == NULL || msg.value < CRED) {
            throw;
        }

        if (post.signatures[msg.sender] > 0) {
            VoidSignature(postID);
        }

        CredRank postRank = postRanks[post.channelID];

        uint256 amount = msg.value - (msg.value % CRED);
        uint256 cred = amount / CRED;

        // Update the rank of the post
        if (post.cred > 0) {
            treeRemove(postRank.tree, post.cred, postID);
        }
        post.cred += cred;
        treeInsert(postRank.tree, post.cred, postID);

        // Update the rank of the channel
        if (postRank.cred > 0) {
            treeRemove(channelRank.tree, postRank.cred, post.channelID);
        }
        postRank.cred += cred;
        treeInsert(channelRank.tree, postRank.cred, post.channelID);

        // Update the aggregate
        channelRank.cred += cred;

        // Create the signature
        post.signatures[msg.sender] = cred;
        PostSign(
            msg.sender,
            post.channelID,
            postID,
            cred,
            block.timestamp
        );

        // Refund any excess
        msg.sender.send(msg.value - amount);
    }

    function VoidSignature(uint256 postID) public {
        Post post = posts[postID];
        uint256 cred = post.signatures[msg.sender];
        if (post.channelID == NULL || cred == NULL) {
            throw;
        }
        CredRank postRank = postRanks[post.channelID];

        uint256 amount = cred * CRED;

        // Update the rank of the post
        treeRemove(postRank.tree, post.cred, postID);
        post.cred -= cred;
        if (post.cred > 0) {
            treeInsert(postRank.tree, post.cred, postID);
        }

        // Update the rank of the channel
        treeRemove(channelRank.tree, postRank.cred, post.channelID);
        postRank.cred -= cred;
        if (postRank.cred > 0) {
            treeInsert(channelRank.tree, postRank.cred, post.channelID);
        }

        // Update the aggregate
        channelRank.cred -= cred;

        post.signatures[msg.sender] = NULL;

        SignatureVoid(
            msg.sender,
            post.channelID,
            postID,
            cred,
            block.timestamp
        );

        msg.sender.send(amount + msg.value);
    }

    // ----- EXTERNAL APIs
    function GetPostRank(uint256 postID) external constant returns (uint) {
        Post post = posts[postID];
        if (post.channelID == NULL || post.cred == NULL) {
            return NULL;
        }
        return treeGetRankByKey(postRanks[post.channelID].tree, post.cred);
    }

    function GetChannelRank(string channelName) external constant returns (uint) {
        uint256 channelCred = postRanks[GetChannelID(channelName)].cred;
        if (channelCred == NULL) {
            return NULL;
        }
        return treeGetRankByKey(channelRank.tree, channelCred);
    }

    function GetPostCred(uint256 postID) external constant returns (uint) {
        return posts[postID].cred;
    }

    function GetChannelCred(string channelName) external constant returns (uint) {
        return postRanks[GetChannelID(channelName)].cred;
    }

    function GetAggregateCred() external constant returns (uint) {
        return channelRank.cred;
    }

    // ----- CHANNEL NAME FILTERS
    function GetChannelID(string name) public constant returns (uint256 id) {
        bytes memory raw = bytes(name);
        if (raw.length > 2 && raw.length < 31) {
            for (uint256 i = 0; i < raw.length; i++) {
                uint8 c = uint8(raw[i]);
                if ((c >= ZERO && c <= NINE) || (c >= LOWERCASE_A && c <= LOWERCASE_Z) || c == UNDERSCORE) {
                    // Shift by 1 byte (*2^8) and add char
                    id *= 256;
                    id += c;
                }
                else if (c >= UPPERCASE_A && c <= UPPERCASE_Z) {
                    // Shift by 1 byte (*2^8) and add lowercase char
                    id *= 256;
                    id += c + (LOWERCASE_A - UPPERCASE_A);
                }
                else {
                    id = 0;
                    break;
                }
            }
        }
        return id;
    }

    function GetChannelName(uint256 id) public constant returns (string) {
        uint256 num = id;
        uint256 byteCount = 0;
        while (num > 0) {
            byteCount++;
            num /= 256;
        }
        num = id;
        bytes memory result = new bytes(byteCount);
        for (uint256 i = byteCount; i > 0; i--) {
            result[i - 1] = bytes1(num % 256);
            num /= 256;
        }
        return string(result);
    }

    // ----- WEB APIs
    function GetPostsByRankRange(string channelName, uint256 startRank, uint256 endRank) public constant returns (uint256[], uint256[], uint256[]) { // rank, id, cred
        uint256 channelID = GetChannelID(channelName);
        if (channelID == 0 || startRank == 0 || endRank == 0 || startRank > endRank) {
            throw;
        }

        uint256[] memory ranks;
        uint256[] memory IDs;

        (ranks, IDs) = treeGetValuesByRankRange(postRanks[channelID].tree, startRank, endRank);

        uint256[] memory cred = new uint256[](ranks.length);
        for (uint256 i = 0; i < IDs.length; i++) {
            cred[i] = posts[IDs[i]].cred;
        }
        return (ranks, IDs, cred);
    }

    function GetChannelsByRankRange(uint256 startRank, uint256 endRank) public constant returns (uint256[], uint256[], uint256[]) { // rank, id, cred
        if (startRank == 0 || endRank == 0 || startRank > endRank) {
            throw;
        }

        uint256[] memory ranks;
        uint256[] memory IDs;

        (ranks, IDs) = treeGetValuesByRankRange(channelRank.tree, startRank, endRank);

        uint256[] memory cred = new uint256[](ranks.length);
        for (uint256 i = 0; i < IDs.length; i++) {
            cred[i] = postRanks[IDs[i]].cred;
        }
        return (ranks, IDs, cred);
    }

    function GetPostCount(string channelName) public constant returns (uint) {
        return postRanks[GetChannelID(channelName)].size;
    }

    function GetChannelCount() public constant returns (uint) {
        return channelRank.size;
    }

    function GetSignatureCred(uint postID, address source) public constant returns (uint) {
        return posts[postID].signatures[source];
    }

    // ----- BINARY SEARCH TREE OPERATIONS
    function treeGetValuesByRankRange(Tree storage tree, uint256 startRank, uint256 endRank) private constant returns (uint256[], uint256[]) {
        uint256[][] memory nodeRanks = new uint256[][](1 + endRank - startRank);
        uint256[][] memory nodeValues = new uint256[][](1 + endRank - startRank);

        // Scan the tree for nodes that fall into the range
        uint256 numValues = 0;
        uint256 nextRank = startRank;
        for (uint256 i = 0; i < nodeRanks.length; i++) {
            (nodeRanks[i], nodeValues[i]) = treeGetValuesByRank(tree, nextRank);

            if (nodeRanks[i].length == 0) {
                break;
            }

            numValues += nodeRanks[i].length;
            nextRank = nodeRanks[i][0] + nodeRanks[i].length;
            if (nextRank > endRank) {
                break;
            }
        }

        // Flatten the 2d arrays
        uint256[] memory ranks = new uint256[](numValues);
        uint256[] memory values = new uint256[](numValues);
        uint nodeIndex = 0;
        uint resultIndex = 0;
        while (resultIndex != numValues) {
            for (uint256 j = 0; j < nodeRanks[nodeIndex].length; j++) {
                ranks[resultIndex] = nodeRanks[nodeIndex][j];
                values[resultIndex] = nodeValues[nodeIndex][j];
                resultIndex++;
            }
            nodeIndex++;
        }
        return (ranks, values);
    }

    function treeGetValuesByRank(Tree storage tree, uint256 rank) private constant returns (uint256[], uint256[]) {
        uint256[] memory ranks;
        uint256[] memory values;

        uint256 index = (tree.nodes.length) / 2;
        uint256 shift = (tree.nodes.length + 1) / 2;

        uint256 resolvedRank = 0;
        while (shift != 0) {
            shift /= 2;
            Node node = tree.nodes[index];

            // To the right
            if (resolvedRank + node.numRight >= rank) {
                index += shift;
            }
            // To the left
            else if (resolvedRank + node.numRight + node.numAt < rank) {
                resolvedRank += node.numRight + node.numAt;
                index -= shift;
            }
            // This is it
            else {
                resolvedRank += 1 + node.numRight;
                ranks = new uint256[](node.numAt);
                values = new uint256[](node.numAt);
                uint256 postID = node.values.last;
                for (uint i = 0; i < node.numAt; i++) {
                    ranks[i] = resolvedRank;
                    values[i] = postID;
                    postID = node.values.prev[postID];
                }
                break;
            }
        }
        return (ranks, values);
    }

    function Test(uint rank) public constant returns (uint) {
        uint256[] memory ranks;
        uint256[] memory values;
        (ranks, values) = treeGetValuesByRank(postRanks[GetChannelID('test')].tree, rank);
        return ranks.length;
    }

    function treeGetRankByKey(Tree storage tree, uint256 key) private constant returns (uint256) {
        uint256 index = (tree.nodes.length) / 2;
        uint256 shift = (tree.nodes.length + 1) / 4;
        uint rank = 1;

        while (index != key) {
            if (index < key) {
                index += shift;
            }
            else {
                rank += tree.nodes[index].numRight + tree.nodes[index].numAt;
                index -= shift;
            }
            shift /= 2;
        }
        return rank;
    }

    function treeInsert(Tree storage tree, uint256 key, uint256 value) private {
        uint256 index = (tree.nodes.length) / 2;
        uint256 shift = (tree.nodes.length + 1) / 4;

        while (index != key) {
            if (index < key) {
                tree.nodes[index].numRight++;
                index += shift;
            }
            else {
                tree.nodes[index].numLeft++;
                index -= shift;
            }
            shift /= 2;
        }

        tree.nodes[index].numAt++;
        setInsert(tree.nodes[index].values, value);
    }

    function treeRemove(Tree storage tree, uint256 key, uint256 value) private {
        uint256 index = (tree.nodes.length) / 2;
        uint256 shift = (tree.nodes.length + 1) / 4;

        while (index != key) {
            if (index < key) {
                tree.nodes[index].numRight--;
                index += shift;
            }
            else {
                tree.nodes[index].numLeft--;
                index -= shift;
            }
            shift /= 2;
        }

        tree.nodes[index].numAt--;
        setRemove(tree.nodes[index].values, value);
    }

    // ----- DOUBLY LINKED SET IMPLEMENTATION
    function setInsert(LinkedSet storage set, uint256 value) private {
        if (set.last == NULL) {
            set.last = value;
        } 
        else if (set.prev[value] == NULL && set.next[value] == NULL && set.last != value) {
            set.next[set.last] = value;
            set.prev[value] = set.last;
            set.last = value;
        }
    }

    function setRemove(LinkedSet storage set, uint256 value) private {
        set.next[set.prev[value]] = set.next[value];
        set.prev[set.next[value]] = set.prev[value];
        if (set.last == value) {
            set.last = set.prev[value];
        }
        set.prev[value] = NULL;
        set.next[value] = NULL;
    }
}
