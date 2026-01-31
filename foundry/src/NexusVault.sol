// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract NexusVault {
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
    
    mapping(uint256 campaignId => CampaignParams) public campaigns;
    uint256 public nextCampaignId;

    mapping(address merchantAddress => uint256 usdcBalance) public merchantBalances;

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
        uint256 amount,
        uint32 destinationDomain,
        bytes32 mintRecipient
    );

    // --- Errors ---
    error NexusVault__InvalidSplit();
    error NexusVault__CampaignNotFound();
    error NexusVault__CampaignInactive();
    error NexusVault__InvalidAmount();
    error NexusVault__InsufficientBalance();
    error NexusVault__RewardLimitReached();

    constructor(address _usdc) {
        USDC = IERC20(_usdc);
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

    // Process a payment with instant referral split
    function payWithReferral(
        uint256 amount,
        uint256 campaignId,
        address referrer,
        string memory orderId
    ) external {
        if (amount == 0) revert NexusVault__InvalidAmount();

        CampaignParams storage campaign = campaigns[campaignId];
        if (!campaign.isActive) revert NexusVault__CampaignInactive();

        // Receive user payment
        USDC.safeTransferFrom(msg.sender, address(this), amount);

        // Calculate potential reward
        uint256 rewardAmount = (amount * campaign.referrerPct) / 100;
        
        // Check limit
        if (campaign.totalRewarded + rewardAmount <= campaign.rewardLimit) {
            campaign.totalRewarded += rewardAmount;
            
            // Instant payment to referrer
            if (rewardAmount > 0) {
                USDC.safeTransfer(referrer, rewardAmount);
                emit RewardPaid(campaignId, referrer, rewardAmount);
            }
            
            // Merchant gets the rest
            uint256 merchantShare = amount - rewardAmount;
            merchantBalances[campaign.merchant] += merchantShare;
            emit PaymentReceived(campaign.merchant, merchantShare, orderId);

        } else {

             revert NexusVault__RewardLimitReached();
        }
    }

    // Standard payment (no referral)
    function pay(
        uint256 amount,
        address merchant,
        string memory orderId
    ) external {
        if (amount == 0) revert NexusVault__InvalidAmount();

        USDC.safeTransferFrom(msg.sender, address(this), amount);
        merchantBalances[merchant] += amount;

        emit PaymentReceived(merchant, amount, orderId);
    }

    // Withdraw merchant sales revenue
    function withdraw(
        uint256 amount,
        uint32 destinationDomain,
        bytes32 mintRecipient
    ) external {
        if (merchantBalances[msg.sender] < amount)
            revert NexusVault__InsufficientBalance();

        merchantBalances[msg.sender] -= amount;

        _payout(msg.sender, amount, destinationDomain, mintRecipient);

        emit FundsWithdrawn(
            msg.sender,
            amount,
            destinationDomain,
            mintRecipient
        );
    }

    function _payout(
        address recipient, 
        uint256 amount, 
        uint32 destinationDomain, 
        bytes32 mintRecipient
    ) internal {
        // TODO gateway stuff
        USDC.safeTransfer(recipient, amount);
    }
}
