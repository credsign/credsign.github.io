pragma solidity ^0.4.2;

library IterableSet {

    struct Set {
        // number of elements in the set
        uint256 size;
        // next[0] = first elt, prev[0] = last elt
        mapping(uint256 => uint256) next;
        mapping(uint256 => uint256) prev;
    }

    modifier nonzero(uint256 value) {
        if (value == 0) {
            throw;
        }
        _;
    }

    function insert(Set storage set, uint256 value) returns (bool inserted) {
        if (!exists(set, value)) {
            inserted = true;
            // Add element to start of set
            set.prev[set.next[0]] = value;
            set.next[value] = set.next[0];
            set.prev[value] = 0;
            set.next[0] = value;
            set.size++;
        }
        return inserted;
    }

    function remove(Set storage set, uint256 value) returns (bool removed) {
        if (exists(set, value)) {
            removed = true;
            set.next[set.prev[value]] = set.next[value];
            set.prev[set.next[value]] = set.prev[value];
            set.prev[value] = 0;
            set.next[value] = 0;
            set.size--;
        }
        return removed;
    }

    function exists(Set storage set, uint256 value) nonzero(value) constant returns (bool) {
        return set.prev[value] != 0 || set.next[value] != 0 || set.next[0] == value;
    }

    function prev(Set storage set, uint256 value) constant returns (uint256) {
        return set.prev[value];
    }

    function next(Set storage set, uint256 value) constant returns (uint256) {
        return set.next[value];
    }

    function size(Set storage set) constant returns (uint256) {
        return set.size;
    }

    function first(Set storage set) constant returns (uint256) {
        return set.next[0];
    }

    function last(Set storage set) constant returns (uint256) {
        return set.prev[0];
    }
}
