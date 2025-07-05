// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

contract HotPotato {
    event PotatoPassed(uint256 indexed id, address indexed from, address indexed to);
    event PotatoBurned(uint256 indexed id, address indexed holder);
    event PotatoRewarded(uint256 indexed id, address indexed holder);
    event ScoreUpdated(address indexed player, uint256 score);

    struct Potato {
        address holder;
        uint256 receivedAt;
        bool active;
        address[5] recentHolders;
        address[] transferHistory;
    }

    address public immutable owner;
    uint256 public potatoCount;
    uint256 public constant TIME_LIMIT = 10 minutes;

    mapping(uint256 => Potato) public potatoes;
    mapping(address => uint256) public scores;
    mapping(uint256 => mapping(address => uint256)) public passedAtIndex;

    constructor() {
        owner = msg.sender;
    }

    function createPotato(address to) external returns (uint256 id) {
        require(msg.sender == owner, "Only owner can create");
        require(to != address(0), "Invalid address");

        id = ++potatoCount;

        Potato storage p = potatoes[id];
        p.holder = to;
        p.receivedAt = block.timestamp;
        p.active = true;
    }

    function passPotato(uint256 id, address to) external {
        require(msg.sender == owner, "Only owner can pass");
        require(to != address(0), "Invalid recipient");

        Potato storage p = potatoes[id];
        require(p.active, "Potato is inactive");
        require(block.timestamp <= p.receivedAt + TIME_LIMIT, "Time expired");
        require(!_isInRecentHolders(p, to), "Recipient is in recent holders");

        emit PotatoPassed(id, p.holder, to);

        _updateRecentHolders(p, p.holder);
        p.transferHistory.push(p.holder);
        passedAtIndex[id][p.holder] = p.transferHistory.length - 1;

        p.holder = to;
        p.receivedAt = block.timestamp;
    }

    function burnPotato(uint256 id) external {
        Potato storage p = potatoes[id];

        require(p.active, "Potato already inactive");
        require(block.timestamp > p.receivedAt + TIME_LIMIT, "Still within time");

        p.active = false;

        uint256 total = p.transferHistory.length;
        for (uint256 i = 0; i < total; i++) {
            address player = p.transferHistory[i];
            uint256 passedAt = passedAtIndex[id][player];
            uint256 gain = total - 1 - passedAt;
            scores[player] += gain;
            emit ScoreUpdated(player, scores[player]);
        }

        emit PotatoBurned(id, msg.sender);
        emit PotatoRewarded(id, msg.sender);
    }

    function getTimeLeft(uint256 id) external view returns (uint256) {
        Potato memory p = potatoes[id];
        if (!p.active || block.timestamp >= p.receivedAt + TIME_LIMIT) return 0;
        return (p.receivedAt + TIME_LIMIT) - block.timestamp;
    }

    function getPotatoHolder(uint256 id) external view returns (address) {
        return potatoes[id].holder;
    }

    function isActive(uint256 id) external view returns (bool) {
        return potatoes[id].active;
    }

    function _isInRecentHolders(Potato storage p, address a) internal view returns (bool) {
        for (uint256 i = 0; i < 5; i++) {
            if (p.recentHolders[i] == a) return true;
        }
        return false;
    }

    function _updateRecentHolders(Potato storage p, address addr) internal {
        for (uint256 i = 4; i > 0; i--) {
            p.recentHolders[i] = p.recentHolders[i - 1];
        }
        p.recentHolders[0] = addr;
    }

    function getScore(address player) external view returns (uint256) {
        return scores[player];
    }
}
