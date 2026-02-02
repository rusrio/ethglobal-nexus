// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {IMessageHandlerV2} from "./interfaces/IMessageHandlerV2.sol";

interface IMessageTransmitter {
    function receiveMessage(bytes calldata message, bytes calldata attestation) 
        external 
        returns (bool success);
}

contract NexusVault is IMessageHandlerV2, IERC165 {
    using SafeERC20 for IERC20;

    // --- Structs ---
    struct CampaignParams {
        uint256 referrerPct;
        address merchant;
        uint256 rewardLimit;   // Max total rewards allowed
        uint256 totalRewarded; // Counter of rewards paid so far
        bool isActive;
    }

    // --- State Variables ---
    IERC20 public immutable USDC;
    IMessageTransmitter public immutable MESSAGE_TRANSMITTER;
    
    mapping(uint256 campaignId => CampaignParams) public campaigns;
    uint256 public nextCampaignId;

    mapping(address merchantAddress => uint256 usdcBalance) public merchantBalances;
    
    // NexusPayRelay contract address (can only be set once)
    address public nexusPayRelay;

    // --- Events ---
    event CampaignCreated(
        uint256 indexed campaignId,
        address indexed merchant,
        uint256 referrerPct,
        uint256 rewardLimit
    );
    event PaymentReceived(
        address indexed merchant,
        uint256 amount,
        string orderId
    );
    event RewardPaid(
        uint256 indexed campaignId,
        address indexed referrer,
        uint256 amount
    );
    event FundsWithdrawn(
        address indexed merchant,
        uint256 amount
    );
    event CCTPPaymentProcessed(
        address indexed merchant,
        uint256 amount,
        string orderId,
        bytes32 messageHash
    );

    // --- Errors ---
    error NexusVault__InvalidSplit();
    error NexusVault__CampaignNotFound();
    error NexusVault__CampaignInactive();
    error NexusVault__InvalidAmount();
    error NexusVault__InsufficientBalance();
    error NexusVault__RewardLimitReached();
    error NexusVault__InvalidMessageFormat();
    error NexusVault__CCTPReceiveFailed();

    constructor(address _usdc, address _messageTransmitter) {
        USDC = IERC20(_usdc);
        MESSAGE_TRANSMITTER = IMessageTransmitter(_messageTransmitter);
    }

    /**
     * @notice ERC165 interface detection
     * @dev Required for MessageTransmitter to detect IMessageHandlerV2 support
     */
    function supportsInterface(bytes4 interfaceId) external pure override returns (bool) {
        return interfaceId == type(IMessageHandlerV2).interfaceId || 
               interfaceId == type(IERC165).interfaceId;
    }

    // --- External Functions ---

    /**
     * @notice Sets the NexusPayRelay contract address (one-time only)
     * @dev Can only be called once to prevent changing the relay after deployment
     * @param _relay Address of the NexusPayRelay contract
     */
    function setNexusPayRelay(address _relay) external {
        require(nexusPayRelay == address(0), "Relay already set");
        require(_relay != address(0), "Invalid relay address");
        nexusPayRelay = _relay;
    }

    // Create a new referral campaign with a reward limit cap
    function createReferralCampaign(
        uint256 referrerPct,
        uint256 rewardLimit
    ) external returns (uint256 campaignId) {
        if (referrerPct > 100) revert NexusVault__InvalidSplit();
        if (rewardLimit == 0) revert NexusVault__InvalidAmount();

        campaignId = nextCampaignId++;
        campaigns[campaignId] = CampaignParams({
            referrerPct: referrerPct,
            merchant: msg.sender,
            rewardLimit: rewardLimit,
            totalRewarded: 0,
            isActive: true
        });

        emit CampaignCreated(
            campaignId,
            msg.sender,
            referrerPct,
            rewardLimit
        );
    }

    // Standard payment (no referral), and no cross-chain (direct payment)
    function pay(
        uint256 amount,
        address merchant,
        string memory orderId
    ) external {
        if (amount == 0) revert NexusVault__InvalidAmount();

        USDC.safeTransferFrom(msg.sender, address(this), amount);
        _processPay(amount, merchant, orderId);
    }

    //TODO payWithReferral()

    
    function handleReceiveFinalizedMessage(
        uint32 sourceDomain,
        bytes32 sender,
        uint32 finalityThresholdExecuted,
        bytes calldata messageBody
    ) external override returns (bool) {
        // Allow calls from MessageTransmitter or NexusPayRelay
        require(
            msg.sender == address(MESSAGE_TRANSMITTER) || 
            msg.sender == nexusPayRelay,
            "Unauthorized caller"
        );
        
        uint256 amount = _extractAmountFromBurnMessage(messageBody);
        bytes memory hookData = _extractHookDataFromBurnMessage(messageBody);
        
        // Decode merchant address and orderId from hookData
        (address merchant, string memory orderId) = abi.decode(
            hookData,
            (address, string)
        );

        _processPay(amount, merchant, orderId);
        
        emit CCTPPaymentProcessed(
            merchant,
            amount,
            orderId,
            keccak256(abi.encodePacked(sourceDomain, sender, messageBody))
        );
        
        return true;
    }

    /**
     * @notice Handles unfinalized messages (not supported for security)
     */
    function handleReceiveUnfinalizedMessage(
        uint32 sourceDomain,
        bytes32 sender,
        uint32 finalityThresholdExecuted,
        bytes calldata messageBody
    ) external override returns (bool) {
        revert("Unfinalized messages not supported");
    }

    // Withdraw merchant earnings to their wallet (on Arc Testnet)
    function withdraw(uint256 amount) external {
        if (merchantBalances[msg.sender] < amount)
            revert NexusVault__InsufficientBalance();

        merchantBalances[msg.sender] -= amount;
        USDC.safeTransfer(msg.sender, amount);

        emit FundsWithdrawn(msg.sender, amount);
    }

    // --- Internal Functions ---
    function _processPay(
        uint256 amount,
        address merchant,
        string memory orderId
    ) internal {
        merchantBalances[merchant] += amount;
        emit PaymentReceived(merchant, amount, orderId);
    }


    function _extractHookData(bytes calldata message) internal pure returns (bytes memory) {
        uint256 hookDataStart = 148 + 228; // 376
        
        if (message.length <= hookDataStart) {
            revert NexusVault__InvalidMessageFormat();
        }
        
        return message[hookDataStart:];
    }

    function _extractAmount(bytes calldata message) internal pure returns (uint256) {

        uint256 amountOffset = 148 + 68;
        
        if (message.length < amountOffset + 32) {
            revert NexusVault__InvalidMessageFormat();
        }
        
        return abi.decode(message[amountOffset:amountOffset + 32], (uint256));
    }

    /**
     * @notice Extracts hookData from BurnMessage
     * @dev HookData starts at offset 228 in the BurnMessage
     * @param messageBody The BurnMessage bytes (NOT full CCTP message)
     */
    function _extractHookDataFromBurnMessage(bytes calldata messageBody) internal pure returns (bytes memory) {
        uint256 hookDataOffset = 228;
        
        if (messageBody.length <= hookDataOffset) {
            revert NexusVault__InvalidMessageFormat();
        }
        
        // Hook Data is everything after offset 228
        return messageBody[hookDataOffset:];
    }

    /**
     * @notice Extracts amount from BurnMessage
     * @dev Amount is at offset 68 in the BurnMessage
     * @param messageBody The BurnMessage bytes (NOT full CCTP message)
     */
    function _extractAmountFromBurnMessage(bytes calldata messageBody) internal pure returns (uint256) {
        uint256 amountOffset = 68;
        
        if (messageBody.length < amountOffset + 32) {
            revert NexusVault__InvalidMessageFormat();
        }
        
        return abi.decode(messageBody[amountOffset:amountOffset + 32], (uint256));
    }

}
