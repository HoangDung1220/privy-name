// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@fhevm/solidity/config/ZamaConfig.sol";
import "@fhevm/solidity/lib/FHE.sol";

contract FHEPrivyName is SepoliaConfig {
    struct NameData {
        uint256 id;
        euint256 name;
        address owner;
    }

    uint256 private _nameCounter;

    // Mapping: id => name
    mapping(uint256 => NameData) private _idToName;

    // Mapping: user => list of names
    mapping(address => NameData[]) private _userNames;

    // Contract owner (người deploy)
    address public owner;

    event NameCreated(address indexed user, uint256 indexed id, euint256 name, uint256 price);

    event Withdraw(address indexed to, uint256 amount);

    constructor() {
        owner = msg.sender;
    }

    /// @notice Create a new name (encrypted as euint256) và gửi ETH
    function createName(externalEuint256 _encryptedName, bytes memory proof) external payable {
        _nameCounter++;

        // Convert external input to euint256
        euint256 encName = FHE.fromExternal(_encryptedName, proof);

        // Allow contract and sender to use/decrypt this ciphertext
        FHE.allowThis(encName);
        FHE.allow(encName, msg.sender);

        NameData memory newName = NameData({id: _nameCounter, name: encName, owner: msg.sender});

        _idToName[_nameCounter] = newName;
        _userNames[msg.sender].push(newName);

        emit NameCreated(msg.sender, _nameCounter, encName, msg.value);
    }

    /// @notice Get all names created by the sender
    function getListNames() external view returns (NameData[] memory) {
        return _userNames[msg.sender];
    }

    /// @notice Get name info by id
    function getNameById(uint256 id) external view returns (NameData memory) {
        require(_idToName[id].id != 0, "Name does not exist");
        return _idToName[id];
    }

    /// @notice Get the total number of names created in the system
    function getTotalNames() external view returns (uint256) {
        return _nameCounter;
    }

    /// @notice Get current contract balance
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /// @notice Withdraw all balance to owner
    function withdraw(address payable to) external {
        require(msg.sender == owner, "Not owner");
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance");
        to.transfer(balance);

        emit Withdraw(to, balance);
    }
}
