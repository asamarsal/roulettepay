// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title ISupraRouter
/// @notice Interface for Supra VRF Router on Arbitrum
interface ISupraRouter {
    /// @notice Request random words from Supra VRF
    /// @param _functionSig Callback function signature
    /// @param _rngCount Number of random words to generate
    /// @param _numConfirmations Number of block confirmations before fulfillment
    /// @param _clientSeed Optional client-provided seed (use 0 for pure VRF)
    /// @param _clientWalletAddress Client wallet address
    /// @return requestId Unique identifier for this VRF request
    function generateRequest(
        string memory _functionSig,
        uint8 _rngCount,
        uint256 _numConfirmations,
        uint256 _clientSeed,
        address _clientWalletAddress
    ) external returns (uint256 requestId);

    /// @notice Deposit funds for VRF service payments
    function addDepositForClient(address _clientAddress) external payable;
}
