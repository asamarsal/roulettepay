// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/ISupraRouter.sol";

/// @title MockSupraRouter
/// @notice Test mock for Supra VRF Router. Allows manual fulfillment in tests.
contract MockSupraRouter is ISupraRouter {

    uint256 private _nextRequestId = 1;

    /// requestId → callback target
    mapping(uint256 => address) public pendingRequests;

    event RandomnessRequested(uint256 indexed requestId, address indexed client);
    event RandomnessFulfilled(uint256 indexed requestId, uint256 randomWord);

    function generateRequest(
        string memory /*_functionSig*/,
        uint8 /*_rngCount*/,
        uint256 /*_numConfirmations*/,
        uint256 /*_clientSeed*/,
        address _clientWalletAddress
    ) external override returns (uint256 requestId) {
        requestId = _nextRequestId++;
        pendingRequests[requestId] = _clientWalletAddress;
        emit RandomnessRequested(requestId, _clientWalletAddress);
    }

    function addDepositForClient(address /*_clientAddress*/) external payable override {
        // no-op in mock
    }

    /// @notice Manually fulfill a VRF request (called by test scripts)
    /// @param requestId The request to fulfill
    /// @param randomWord The mock random number to return
    function fulfillRandomness(uint256 requestId, uint256 randomWord) external {
        address client = pendingRequests[requestId];
        require(client != address(0), "Mock: unknown request");

        uint256[] memory randomWords = new uint256[](1);
        randomWords[0] = randomWord;

        // Call the consumer's supraCallback
        (bool success, ) = client.call(
            abi.encodeWithSignature("supraCallback(uint256,uint256[])", requestId, randomWords)
        );
        require(success, "Mock: callback failed");

        delete pendingRequests[requestId];
        emit RandomnessFulfilled(requestId, randomWord);
    }

    /// @notice Fulfill with a pseudo-random word derived from block data (dev only)
    function fulfillWithPseudoRandom(uint256 requestId) external {
        uint256 pseudoRandom = uint256(
            keccak256(abi.encodePacked(block.timestamp, block.prevrandao, requestId, msg.sender))
        );
        this.fulfillRandomness(requestId, pseudoRandom);
    }
}
