"use client";

// src/components/NexusPayment.tsx
import { useState as useState3, useEffect } from "react";

// src/constants/contracts.ts
var CCTP_CONTRACTS = {
  // Ethereum Sepolia
  11155111: {
    tokenMessenger: "0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA",
    messageTransmitter: "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275",
    usdc: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    domain: 0,
    name: "Ethereum Sepolia"
  },
  // Base Sepolia
  84532: {
    tokenMessenger: "0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA",
    messageTransmitter: "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275",
    usdc: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    domain: 6,
    name: "Base Sepolia"
  },
  // Arbitrum Sepolia
  421614: {
    tokenMessenger: "0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA",
    messageTransmitter: "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275",
    usdc: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
    domain: 3,
    name: "Arbitrum Sepolia"
  },
  // Arc Testnet
  5042002: {
    tokenMessenger: "0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA",
    messageTransmitter: "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275",
    usdc: "0x3600000000000000000000000000000000000000",
    domain: 26,
    name: "Arc Testnet"
  }
};
var NEXUS_VAULT_ADDRESS = "0x05949CFfCE00B0032194cb7B8f8e72bBF1376012";
var NEXUS_PAY_RELAY_ADDRESS = "0xCDe4188f4bB253dc5f896bDd230B8b56Dff37386";
var NEXUS_PAY_RELAY_ABI = [
  {
    type: "function",
    name: "relayPayment",
    stateMutability: "nonpayable",
    inputs: [
      { name: "message", type: "bytes" },
      { name: "attestation", type: "bytes" }
    ],
    outputs: [{ type: "bool" }]
  },
  {
    type: "function",
    name: "getConfiguration",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { name: "messageTransmitter", type: "address" },
      { name: "nexusVault", type: "address" }
    ]
  },
  {
    type: "event",
    name: "PaymentRelayed",
    inputs: [
      { name: "messageHash", type: "bytes32", indexed: true },
      { name: "merchant", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
      { name: "sourceDomain", type: "uint32", indexed: false }
    ]
  }
];
var ARC_TESTNET_CHAIN_ID = 5042002;

// src/components/NexusPayment.tsx
import { useAccount as useAccount2, useChainId } from "wagmi";
import { parseUnits } from "viem";

// src/hooks/useDirectPayment.ts
import { useState } from "react";
import { useWriteContract } from "wagmi";

// src/constants/abis.ts
var NEXUS_VAULT_ABI = [
  {
    type: "function",
    name: "pay",
    inputs: [
      { name: "amount", type: "uint256" },
      { name: "merchant", type: "address" },
      { name: "orderId", type: "string" }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "handleReceiveFinalizedMessage",
    inputs: [
      { name: "sourceDomain", type: "uint32" },
      { name: "sender", type: "bytes32" },
      { name: "finalityThresholdExecuted", type: "uint32" },
      { name: "messageBody", type: "bytes" }
    ],
    outputs: [{ name: "success", type: "bool" }],
    stateMutability: "nonpayable"
  }
];
var USDC_ABI = [
  {
    type: "function",
    name: "approve",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "allowance",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" }
    ],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view"
  }
];
var TOKEN_MESSENGER_ABI = [
  {
    type: "function",
    name: "depositForBurnWithHook",
    inputs: [
      { name: "amount", type: "uint256" },
      { name: "destinationDomain", type: "uint32" },
      { name: "mintRecipient", type: "bytes32" },
      { name: "burnToken", type: "address" },
      { name: "destinationCaller", type: "bytes32" },
      { name: "maxFee", type: "uint256" },
      { name: "minFinalityThreshold", type: "uint32" },
      { name: "hookData", type: "bytes" }
    ],
    outputs: [{ name: "nonce", type: "uint64" }],
    stateMutability: "nonpayable"
  }
];

// src/hooks/useDirectPayment.ts
function useDirectPayment() {
  const [status, setStatus] = useState("idle");
  const [currentStep, setCurrentStep] = useState("");
  const [error, setError] = useState(null);
  const { writeContractAsync } = useWriteContract();
  const executePayment = async (params) => {
    try {
      if (!params || !params.amount) throw new Error("Invalid parameters");
      setError(null);
      setStatus("approving");
      setCurrentStep("Approving USDC transfer...");
      await writeContractAsync({
        address: params.usdcAddress,
        abi: USDC_ABI,
        functionName: "approve",
        args: [NEXUS_VAULT_ADDRESS, params.amount]
      });
      setStatus("approving");
      setCurrentStep("Waiting for approval confirmation...");
      await new Promise((resolve) => setTimeout(resolve, 2e3));
      setStatus("burning");
      setCurrentStep("Finalizing payment on Arc...");
      const payTxHash = await writeContractAsync({
        address: NEXUS_VAULT_ADDRESS,
        abi: NEXUS_VAULT_ABI,
        functionName: "pay",
        args: [params.amount, params.merchant, params.orderId]
      });
      setStatus("success");
      setCurrentStep("Payment Successful!");
      return payTxHash;
    } catch (err) {
      const error2 = err instanceof Error ? err : new Error("Payment failed");
      setError(error2);
      setStatus("error");
      setCurrentStep("Failed");
      throw error2;
    }
  };
  return {
    executePayment,
    status,
    currentStep,
    error,
    isLoading: status !== "idle" && status !== "success" && status !== "error"
  };
}

// src/hooks/useCCTPBridge.ts
import { useState as useState2 } from "react";
import { useWriteContract as useWriteContract2, usePublicClient, useSwitchChain, useAccount } from "wagmi";
import { parseAbiParameters, encodeAbiParameters } from "viem";
import { privateKeyToAccount } from "viem/accounts";

// src/utils/cctp.ts
function addressToBytes32(address) {
  const hex = address.slice(2).padStart(64, "0");
  return `0x${hex}`;
}

// src/hooks/useCCTPBridge.ts
function useCCTPBridge() {
  const { address, chainId } = useAccount();
  const { writeContractAsync } = useWriteContract2();
  const { switchChainAsync } = useSwitchChain();
  const [status, setStatus] = useState2("idle");
  const [currentStep, setCurrentStep] = useState2("");
  const [error, setError] = useState2("");
  const publicClient = usePublicClient();
  const executePayment = async (params) => {
    try {
      setError(null);
      const chainConfig = CCTP_CONTRACTS[params.sourceChainId];
      if (!chainConfig) {
        throw new Error(`Unsupported chain: ${params.sourceChainId}`);
      }
      setStatus("approving");
      setCurrentStep("Approving USDC...");
      const protocolFee = 20000n;
      const totalAmountToBurn = params.amount + protocolFee;
      const approveTxHash = await writeContractAsync({
        address: chainConfig.usdc,
        abi: USDC_ABI,
        functionName: "approve",
        args: [chainConfig.tokenMessenger, totalAmountToBurn]
      });
      console.log("Approval tx:", approveTxHash);
      setStatus("burning");
      setCurrentStep("Preparing hook data...");
      let hookData;
      if (params.campaignId && params.referrer && Number(params.campaignId) > 0) {
        console.log("Encoding referral data:", params.campaignId, params.referrer);
        hookData = encodeAbiParameters(
          parseAbiParameters("address, string, uint256, address"),
          [params.merchant, params.orderId, BigInt(params.campaignId), params.referrer]
        );
      } else {
        hookData = encodeAbiParameters(
          parseAbiParameters("address, string"),
          [params.merchant, params.orderId]
        );
      }
      setCurrentStep("Burning USDC on source chain...");
      const destinationDomain = CCTP_CONTRACTS[ARC_TESTNET_CHAIN_ID].domain;
      const mintRecipient = addressToBytes32(NEXUS_VAULT_ADDRESS);
      const burnTxHash = await writeContractAsync({
        address: chainConfig.tokenMessenger,
        abi: TOKEN_MESSENGER_ABI,
        functionName: "depositForBurnWithHook",
        args: [
          totalAmountToBurn,
          // Payment + protocol fee
          destinationDomain,
          mintRecipient,
          chainConfig.usdc,
          "0x0000000000000000000000000000000000000000000000000000000000000000",
          // destinationCaller = 0
          protocolFee,
          // maxFee for Circle protocol fee
          1e3,
          // minFinalityThreshold
          hookData
          // merchant + orderId
        ],
        gas: 500000n
        // Explicit gas limit to avoid Sepolia's 16.777M cap
      });
      console.log("Burn tx:", burnTxHash);
      setCurrentStep("Waiting for Circle attestation (~20 seconds)...");
      const sourceDomain = chainConfig.domain;
      const attestation = await pollForAttestation(burnTxHash, sourceDomain);
      if (!attestation) {
        throw new Error("Failed to get attestation from Circle");
      }
      setCurrentStep("Finalizing payment on Arc (automatic)...");
      const operatorPrivateKey = params.operatorPrivateKey;
      if (!operatorPrivateKey || operatorPrivateKey === "0x") {
        throw new Error("Operator private key not configured");
      }
      const operatorAccount = privateKeyToAccount(operatorPrivateKey);
      const { createWalletClient, http } = await import("viem");
      const arcWalletClient = createWalletClient({
        account: operatorAccount,
        chain: {
          id: ARC_TESTNET_CHAIN_ID,
          name: "Arc Testnet",
          network: "arc-testnet",
          nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
          rpcUrls: {
            default: { http: ["https://rpc.testnet.arc.network"] },
            public: { http: ["https://rpc.testnet.arc.network"] }
          }
        },
        transport: http("https://rpc.testnet.arc.network")
      });
      const receiveTxHash = await arcWalletClient.writeContract({
        address: NEXUS_PAY_RELAY_ADDRESS,
        abi: NEXUS_PAY_RELAY_ABI,
        functionName: "relayPayment",
        args: [attestation.message, attestation.attestation],
        gas: 500000n
      });
      console.log("Receive tx:", receiveTxHash);
      setStatus("success");
      setCurrentStep("Payment completed! Merchant balance updated automatically.");
      return {
        burnTxHash,
        receiveTxHash,
        amount: params.amount
      };
    } catch (error2) {
      console.error("Bridge error:", error2);
      setStatus("error");
      setCurrentStep(error2.message || "Transaction failed");
      setError(error2.message || "Unknown error");
      throw error2;
    }
  };
  return {
    executePayment,
    status,
    error,
    currentStep,
    isLoading: status !== "idle" && status !== "success" && status !== "error"
  };
}
async function pollForAttestation(txHash, sourceDomain, maxAttempts = 20) {
  const apiUrl = `https://iris-api-sandbox.circle.com/v2/messages/${sourceDomain}?transactionHash=${txHash}`;
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(apiUrl);
      const data = await response.json();
      if (data.messages?.length > 0) {
        const msg = data.messages[0];
        if (msg.status === "complete" && msg.attestation && msg.message && typeof msg.attestation === "string" && typeof msg.message === "string" && msg.attestation.startsWith("0x") && msg.message.startsWith("0x") && msg.attestation !== "0x" && msg.message !== "0x" && !msg.attestation.includes("PENDING") && !msg.message.includes("PENDING")) {
          return {
            message: msg.message,
            attestation: msg.attestation
          };
        }
      }
    } catch (error) {
      console.log(`Attestation attempt ${i + 1}/${maxAttempts} failed, retrying...`);
    }
    await new Promise((resolve) => setTimeout(resolve, 3e3));
  }
  return null;
}

// src/components/NexusPayment.styles.ts
var styles = {
  container: {
    fontFamily: '"Geist", "Inter", sans-serif',
    maxWidth: "420px",
    margin: "0 auto",
    background: "rgba(255, 255, 255, 0.95)",
    borderRadius: "24px",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0,0,0,0.02)",
    padding: "32px",
    position: "relative",
    overflow: "hidden",
    backdropFilter: "blur(10px)"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "40px"
  },
  logoRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },
  logoIcon: {
    width: "24px",
    height: "24px",
    background: "#111",
    color: "#fff",
    borderRadius: "6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    fontSize: "14px"
  },
  logoText: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#111",
    letterSpacing: "-0.5px"
  },
  walletBadge: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "6px 12px",
    background: "#f3f4f6",
    borderRadius: "20px"
  },
  walletAvatar: {
    width: "16px",
    height: "16px",
    borderRadius: "50%"
  },
  walletAddress: {
    fontSize: "12px",
    fontWeight: "500",
    color: "#4b5563",
    fontFamily: "monospace"
  },
  disconnectedBadge: {
    fontSize: "12px",
    color: "#ef4444",
    background: "#fef2f2",
    padding: "4px 10px",
    borderRadius: "20px",
    fontWeight: "600"
  },
  amountSection: {
    marginBottom: "40px",
    textAlign: "center"
  },
  label: {
    fontSize: "11px",
    textTransform: "uppercase",
    letterSpacing: "1px",
    color: "#9ca3af",
    fontWeight: "600",
    marginBottom: "12px",
    display: "block"
  },
  hugeDisplay: {
    fontSize: "48px",
    fontWeight: "700",
    color: "#111",
    letterSpacing: "-2px"
  },
  inputWrapper: {
    position: "relative",
    display: "flex",
    justifyContent: "center",
    alignItems: "baseline"
  },
  currencyPrefix: {
    fontSize: "32px",
    color: "#d1d5db",
    fontWeight: "500",
    marginRight: "4px"
  },
  hugeInput: {
    fontSize: "56px",
    fontWeight: "700",
    color: "#111",
    border: "none",
    background: "transparent",
    textAlign: "center",
    width: "240px",
    letterSpacing: "-2px",
    outline: "none"
  },
  currencySymbol: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#9ca3af",
    marginLeft: "8px"
  },
  actionSection: {
    marginTop: "auto"
  },
  networkInfo: {
    textAlign: "center",
    fontSize: "12px",
    color: "#6b7280",
    marginBottom: "16px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "6px"
  },
  networkDot: {
    width: "6px",
    height: "6px",
    background: "#10b981",
    borderRadius: "50%",
    boxShadow: "0 0 0 2px rgba(16, 185, 129, 0.2)"
  },
  payButton: {
    width: "100%",
    height: "56px",
    background: "#111",
    color: "#fff",
    border: "none",
    borderRadius: "16px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  payButtonDisabled: {
    background: "#e5e7eb",
    color: "#9ca3af",
    cursor: "not-allowed"
  },
  loadingSpinner: {
    width: "20px",
    height: "20px",
    border: "2px solid rgba(255,255,255,0.3)",
    borderTopColor: "#fff",
    borderRadius: "50%",
    animation: "spin 1s linear infinite"
  },
  stepperContainer: {
    background: "#f9fafb",
    borderRadius: "16px",
    padding: "24px",
    marginBottom: "24px"
  },
  stepperTrack: {
    display: "flex",
    justifyContent: "space-between",
    position: "relative",
    marginBottom: "16px"
  },
  stepItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    zIndex: 1,
    position: "relative"
  },
  stepDot: {
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    background: "#fff",
    border: "2px solid #e5e7eb",
    marginBottom: "8px",
    transition: "all 0.3s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  stepDotActive: {
    borderColor: "#3b82f6",
    boxShadow: "0 0 0 4px rgba(59, 130, 246, 0.1)"
  },
  stepDotCompleted: {
    background: "#3b82f6",
    borderColor: "#3b82f6",
    color: "#fff"
  },
  stepLabel: {
    fontSize: "10px",
    fontWeight: "600",
    color: "#9ca3af",
    textTransform: "uppercase"
  },
  stepLabelActive: {
    color: "#3b82f6"
  },
  checkmark: {
    fontSize: "12px",
    fontWeight: "bold"
  },
  stepMessage: {
    textAlign: "center",
    fontSize: "13px",
    color: "#4b5563",
    fontWeight: "500"
  },
  errorBox: {
    background: "#fef2f2",
    color: "#dc2626",
    padding: "16px",
    borderRadius: "12px",
    fontSize: "13px",
    marginBottom: "24px",
    textAlign: "center"
  },
  successBox: {
    background: "#f0fdf4",
    color: "#16a34a",
    padding: "16px",
    borderRadius: "12px",
    fontSize: "13px",
    marginBottom: "24px",
    textAlign: "center"
  },
  link: {
    color: "#16a34a",
    fontWeight: "700",
    marginLeft: "6px",
    textDecoration: "underline"
  },
  stepDotSpinner: {
    width: "14px",
    height: "14px",
    border: "2px solid rgba(59, 130, 246, 0.2)",
    borderTopColor: "#3b82f6",
    borderRadius: "50%",
    animation: "spin 1s linear infinite"
  }
};

// src/components/NexusPayment.tsx
import { jsx, jsxs } from "react/jsx-runtime";
var PaymentStepper = ({ currentStep, status }) => {
  const getStepIndex = () => {
    if (status === "success") return 3;
    if (status === "error") return -1;
    if (status === "approving") return 0;
    if (currentStep.includes("Burning") || currentStep.includes("attestation") || currentStep.includes("Waiting") || currentStep.includes("Finalizing")) return 1;
    return 0;
  };
  const activeIndex = getStepIndex();
  const steps = ["APPROVE", "TRANSFER", "PAID"];
  return /* @__PURE__ */ jsxs("div", { style: styles.stepperContainer, children: [
    /* @__PURE__ */ jsx("style", { children: `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }` }),
    /* @__PURE__ */ jsx("div", { style: styles.stepperTrack, children: steps.map((label, index) => {
      let isActive = false;
      let isCompleted = false;
      if (index < activeIndex) {
        isCompleted = true;
      } else if (index === activeIndex) {
        isActive = true;
      }
      return /* @__PURE__ */ jsxs("div", { style: styles.stepItem, children: [
        /* @__PURE__ */ jsxs("div", { style: {
          ...styles.stepDot,
          ...isActive ? styles.stepDotActive : {},
          ...isCompleted ? styles.stepDotCompleted : {}
        }, children: [
          isActive && /* @__PURE__ */ jsx("div", { style: styles.stepDotSpinner }),
          isCompleted && /* @__PURE__ */ jsx("span", { style: styles.checkmark, children: "\u2713" })
        ] }),
        /* @__PURE__ */ jsx("span", { style: {
          ...styles.stepLabel,
          ...isActive || isCompleted ? styles.stepLabelActive : {}
        }, children: label })
      ] }, label);
    }) })
  ] });
};
function NexusPayment(props) {
  const {
    merchantAddress,
    orderId,
    operatorPrivateKey,
    mode = "variable",
    amount: fixedAmount,
    minAmount,
    maxAmount,
    className = "",
    buttonText,
    amountLabel = "PAYMENT AMOUNT",
    onSuccess,
    onError,
    onStatusChange,
    onClose,
    referralCampaignId,
    referrerAddress
  } = props;
  const { address, chain } = useAccount2();
  const chainId = useChainId();
  const directPayment = useDirectPayment();
  const cctpBridge = useCCTPBridge();
  const [inputAmount, setInputAmount] = useState3("");
  const [txHash, setTxHash] = useState3(null);
  const isDirectPayment = chainId === ARC_TESTNET_CHAIN_ID;
  let activeHook = cctpBridge;
  if (isDirectPayment) activeHook = directPayment;
  const currentStatus = activeHook.status;
  const currentError = activeHook.error;
  const isLoading = activeHook.isLoading;
  useEffect(() => {
    if (onStatusChange && currentStatus) {
      onStatusChange(currentStatus);
    }
  }, [currentStatus, onStatusChange]);
  const handlePayment = async () => {
    try {
      const amount = mode === "fixed" ? fixedAmount : parseUnits(inputAmount, 6);
      if (amount === 0n) throw new Error("Amount must be greater than 0");
      if (!address) throw new Error("Please connect your EVM wallet");
      const chainConfig = CCTP_CONTRACTS[chainId];
      if (!chainConfig) throw new Error("Unsupported EVM chain");
      let resultTxHash;
      if (isDirectPayment) {
        resultTxHash = await directPayment.executePayment({
          amount,
          merchant: merchantAddress,
          orderId,
          usdcAddress: chainConfig.usdc,
          userAddress: address
        });
      } else {
        const result = await cctpBridge.executePayment({
          amount,
          merchant: merchantAddress,
          orderId,
          sourceChainId: chainId,
          operatorPrivateKey,
          campaignId: referralCampaignId,
          referrer: referrerAddress
        });
        resultTxHash = result.burnTxHash;
      }
      setTxHash(resultTxHash);
      onSuccess?.(resultTxHash, amount);
    } catch (err) {
      onError?.(err);
    }
  };
  const getWalletGradient = (addr) => {
    const seed = parseInt(addr.slice(0, 8), 16) || 0;
    const c1 = Math.floor(seed % 360);
    const c2 = Math.floor(seed / 360 % 360);
    return `linear-gradient(135deg, hsl(${c1}, 70%, 60%), hsl(${c2}, 70%, 60%))`;
  };
  return /* @__PURE__ */ jsxs("div", { className: `nexus-payment ${className}`, style: styles.container, children: [
    /* @__PURE__ */ jsx("div", { style: styles.header, children: /* @__PURE__ */ jsxs("div", { style: styles.logoRow, children: [
      /* @__PURE__ */ jsx("div", { style: styles.logoIcon, children: "N" }),
      /* @__PURE__ */ jsx("span", { style: styles.logoText, children: "NexusPay" })
    ] }) }),
    /* @__PURE__ */ jsx("div", { style: { marginBottom: "24px", display: "flex", justifyContent: "center" }, children: address ? /* @__PURE__ */ jsxs("div", { style: styles.walletBadge, children: [
      /* @__PURE__ */ jsx("div", { style: { ...styles.walletAvatar, background: getWalletGradient(address) } }),
      /* @__PURE__ */ jsxs("span", { style: styles.walletAddress, children: [
        address.slice(0, 6),
        "...",
        address.slice(-4)
      ] })
    ] }) : /* @__PURE__ */ jsx("div", { style: styles.disconnectedBadge, children: "EVM Wallet Not Connected" }) }),
    /* @__PURE__ */ jsxs("div", { style: styles.amountSection, children: [
      /* @__PURE__ */ jsx("label", { style: styles.label, children: amountLabel }),
      mode === "fixed" ? /* @__PURE__ */ jsxs("div", { style: styles.hugeDisplay, children: [
        (Number(fixedAmount) / 1e6).toFixed(2),
        /* @__PURE__ */ jsx("span", { style: styles.currencySymbol, children: "USDC" })
      ] }) : /* @__PURE__ */ jsxs("div", { style: styles.inputWrapper, children: [
        /* @__PURE__ */ jsx("span", { style: styles.currencyPrefix, children: "$" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "number",
            value: inputAmount,
            onChange: (e) => setInputAmount(e.target.value),
            placeholder: "0.00",
            style: styles.hugeInput
          }
        ),
        /* @__PURE__ */ jsx("span", { style: styles.currencySymbol, children: "USDC" })
      ] })
    ] }),
    (activeHook.isLoading || currentStatus === "success") && /* @__PURE__ */ jsx(
      PaymentStepper,
      {
        currentStep: activeHook.currentStep,
        status: currentStatus
      }
    ),
    currentError && /* @__PURE__ */ jsxs("div", { style: styles.errorBox, children: [
      "\u26A0\uFE0F ",
      typeof currentError === "string" ? currentError : currentError.message
    ] }),
    currentStatus === "success" && txHash && /* @__PURE__ */ jsxs("div", { style: styles.successBox, children: [
      "\u2705 Payment Successful!",
      chain?.blockExplorers?.default && /* @__PURE__ */ jsx(
        "a",
        {
          href: `${chain.blockExplorers.default.url}/tx/${txHash}`,
          target: "_blank",
          rel: "noreferrer",
          style: styles.link,
          children: "View Receipt"
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { style: styles.actionSection, children: [
      chain && /* @__PURE__ */ jsxs("div", { style: styles.networkInfo, children: [
        /* @__PURE__ */ jsx("span", { style: styles.networkDot }),
        "Running on ",
        chain.name
      ] }),
      currentStatus === "success" && onClose ? /* @__PURE__ */ jsx(
        "button",
        {
          onClick: onClose,
          style: {
            ...styles.payButton,
            background: "#fff",
            color: "#111",
            border: "2px solid #e5e7eb"
          },
          children: "Close"
        }
      ) : /* @__PURE__ */ jsx(
        "button",
        {
          onClick: handlePayment,
          disabled: !address || isLoading,
          style: {
            ...styles.payButton,
            ...!address || isLoading ? styles.payButtonDisabled : {}
          },
          children: isLoading ? /* @__PURE__ */ jsx("span", { style: styles.loadingSpinner }) : !address ? "Connect Wallet" : buttonText || "Pay Now"
        }
      )
    ] })
  ] });
}
export {
  ARC_TESTNET_CHAIN_ID,
  NEXUS_VAULT_ADDRESS,
  NexusPayment
};
//# sourceMappingURL=index.js.map