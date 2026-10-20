// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract TreeLedgerAudit {
    address public owner;

    event MaintenanceLogged(
        string indexed treeId,
        string actionType,
        string proofHash,
        uint256 timestamp,
        address indexed contractor
    );

    constructor() {
        owner = msg.sender;
    }

    function logMaintenance(
        string calldata treeId,
        string calldata actionType,
        string calldata proofHash
    ) external returns (bytes32) {
        bytes32 recordHash = keccak256(
            abi.encodePacked(treeId, actionType, proofHash, block.timestamp, msg.sender)
        );
        emit MaintenanceLogged(treeId, actionType, proofHash, block.timestamp, msg.sender);
        return recordHash;
    }
}
