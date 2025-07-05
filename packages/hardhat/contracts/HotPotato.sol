// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

contract HotPotato {
    event PotatoPassed(uint256 indexed id, address indexed from, address indexed to, string walrusCID);
    event PotatoBurned(uint256 indexed id, address indexed holder);
    event PotatoRewarded(uint256 indexed id, address indexed holder);

    struct Potato {
        address holder;
        uint256 receivedAt;
        bool active;
    }

    uint256 public potatoCount;
    uint256 public constant TIME_LIMIT = 10 minutes;
    mapping(uint256 => Potato) public potatoes;

    function createPotato(address to) external returns (uint256 id) {
        require(to != address(0), "Invalid address");

        id = ++potatoCount;
        potatoes[id] = Potato({
            holder: to,
            receivedAt: block.timestamp,
            active: true
        });
    }

    function passPotato(uint256 id, address to, string calldata walrusCID) external {
        Potato storage p = potatoes[id];

        require(p.active, "Potato is inactive");
        require(msg.sender == p.holder, "Not current holder");
        require(to != address(0), "Invalid recipient");
        require(block.timestamp <= p.receivedAt + TIME_LIMIT, "Time expired");

        emit PotatoPassed(id, msg.sender, to, walrusCID);

        p.holder = to;
        p.receivedAt = block.timestamp;
    }

    function burnPotato(uint256 id) external {
        Potato storage p = potatoes[id];

        require(p.active, "Potato already inactive");
        require(msg.sender == p.holder, "Not current holder");
        require(block.timestamp > p.receivedAt + TIME_LIMIT, "Still within time");

        p.active = false;

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
}
