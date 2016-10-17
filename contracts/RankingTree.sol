pragma solidity ^0.4.2;

import "IterableSet.sol";

library RankingTree {

    struct Tree {
        uint256 size;
        // (2 ** 37) - 1; 137,438,953,471 elts; range [0..1,374,389,534.70] ether
        // TODO: this number is a loose upper bound; tighten it?
        Node[137438953471] nodes;
    }

    struct Node {

        // TODO: pack these into ONE uint256? :0
        uint256 numAt;
        uint256 numLeft;
        uint256 numRight;
        uint256 leftChild;
        uint256 rightChild;

        IterableSet.Set values;
    }

    function size(Tree storage tree) constant returns (uint256) {
        return tree.size;
    }

    function findCommonAncestor(Tree storage tree, uint256 keyA, uint256 keyB) returns (uint256, uint256) {
        uint256 index = (tree.nodes.length) / 2;
        uint256 shift = (tree.nodes.length + 1) / 4;
        while ((index < keyA && index < keyB) || (index > keyA && index > keyB)) {
            if (index < keyA) {
                index += shift;
            }
            else {
                index -= shift;
            }
            shift /= 2;
        }
        return (index, shift);
    }

    function insert(Tree storage tree, uint256 key, uint256 value) returns (bool inserted) {
        if (IterableSet.insert(tree.nodes[key].values, value)) {
            inserted = true;

            uint256 index = (tree.nodes.length) / 2;
            uint256 shift = (tree.nodes.length + 1) / 4;
            Node node = tree.nodes[index];
            while (index != key) {
                if (index < key) {
                    if (node.numRight == 0) {
                        index = key;
                        node.rightChild = index;
                    }
                    else if (node.rightChild == index + shift) {
                        index += shift;
                        shift /= 2;
                    }
                    else {
                        (index, shift) = findCommonAncestor(tree, key, node.rightChild);
                        if (index < node.rightChild) {
                            tree.nodes[index].rightChild = node.rightChild;
                            tree.nodes[index].numRight = node.numRight;
                            node.rightChild = index;
                        }
                        else if (index > node.rightChild) {
                            tree.nodes[index].leftChild = node.rightChild;
                            tree.nodes[index].numLeft = node.numRight;
                            node.rightChild = index;
                        }
                    }
                    node.numRight++;
                }
                else {
                    if (node.numLeft == 0) {
                        index = key;
                        node.leftChild = index;
                    }
                    else if (node.leftChild == index - shift) {
                        index -= shift;
                        shift /= 2;
                    }
                    else {
                        (index, shift) = findCommonAncestor(tree, key, node.leftChild);
                        if (index < node.leftChild) {
                            tree.nodes[index].rightChild = node.leftChild;
                            tree.nodes[index].numRight = node.numLeft;
                            node.leftChild = index;
                        }
                        else if (index > node.leftChild) {
                            tree.nodes[index].leftChild = node.leftChild;
                            tree.nodes[index].numLeft = node.numLeft;
                            node.leftChild = index;
                        }
                    }
                    node.numLeft++;
                }
                node = tree.nodes[index];
            }
            node.numAt++;
            tree.size++;
        }
        return inserted;
    }

    function remove(Tree storage tree, uint256 key, uint256 value) returns (bool removed) {
        if (IterableSet.remove(tree.nodes[key].values, value)) {
            removed = true;

            uint256 index = (tree.nodes.length) / 2;
            uint256 parent = 0;
            while (index != key) {
                parent = index;
                if (index < key) {
                    tree.nodes[index].numRight--;
                    index = tree.nodes[index].rightChild;
                }
                else {
                    tree.nodes[index].numLeft--;
                    index = tree.nodes[index].leftChild;
                }
            }
            Node node = tree.nodes[index];
            node.numAt--;
            if (node.numAt == 0 && parent != 0) {
                if (node.numLeft == 0 && node.numRight == 0) {
                    if (tree.nodes[parent].leftChild == index) {
                        tree.nodes[parent].leftChild = 0;
                    }
                    else if (tree.nodes[parent].rightChild == index) {
                        tree.nodes[parent].rightChild = 0;
                    }
                }
                else if (node.numLeft > 0) {
                    if (tree.nodes[parent].leftChild == index) {
                        tree.nodes[parent].leftChild = node.leftChild;
                    }
                    else if (tree.nodes[parent].rightChild == index) {
                        tree.nodes[parent].rightChild = node.leftChild;
                    }
                }
                else if (node.numRight > 0) {
                    if (tree.nodes[parent].leftChild == index) {
                        tree.nodes[parent].leftChild = node.rightChild;
                    }
                    else if (tree.nodes[parent].rightChild == index) {
                        tree.nodes[parent].rightChild = node.rightChild;
                    }
                }
            }
            tree.size--;
        }
        return removed;
    }

    function getRankByKeyValue(Tree storage tree, uint256 key, uint256 value) constant returns (uint256 rank) {
        if (IterableSet.exists(tree.nodes[key].values, value)) {
            rank = 1;

            uint256 index = (tree.nodes.length) / 2;
            while (index != key) {
                if (index < key) {
                    index = tree.nodes[index].rightChild;
                }
                else {
                    rank += tree.nodes[index].numRight + tree.nodes[index].numAt;
                    index = tree.nodes[index].leftChild;
                }
            }
            rank += tree.nodes[index].numRight;
        }
        return rank;
    }

    function getValueByRank(Tree storage tree, uint256 rank) constant returns (uint256 value, uint256 resolvedRank) {
        if (rank > 0 && rank <= tree.size) {
            resolvedRank = 1;

            Node node = tree.nodes[tree.nodes.length / 2];
            resolvedRank += node.numRight;
            while ((resolvedRank > rank) || (resolvedRank + node.numAt <= rank)) {
                if (resolvedRank > rank) {
                    resolvedRank -= node.numRight;
                    node = tree.nodes[node.rightChild];
                }
                else {
                    resolvedRank += node.numAt;
                    node = tree.nodes[node.leftChild];
                }
                resolvedRank += node.numRight;
            }
            value = IterableSet.first(node.values);
            for (uint i = 0; i < node.numAt; i++) {
                if (resolvedRank + i == rank) {
                    break;
                }
                value = IterableSet.next(node.values, value);
            }
        }
        return (value, resolvedRank);
    }
}
