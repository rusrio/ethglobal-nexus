"use client";

// src/components/NexusPayment.tsx
import { useState as useState3 } from "react";

// src/constants/contracts.ts
var CCTP_CONTRACTS = {
  // Ethereum Sepolia
  11155111: {
    tokenMessenger: "0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5",
    messageTransmitter: "0x7865fAfC2db2093669d92c0F33AeEF291086BEFD",
    usdc: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    domain: 0,
    name: "Ethereum Sepolia"
  },
  // Base Sepolia
  84532: {
    tokenMessenger: "0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5",
    messageTransmitter: "0x7865fAfC2db2093669d92c0F33AeEF291086BEFD",
    usdc: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    domain: 6,
    name: "Base Sepolia"
  },
  // Arbitrum Sepolia
  421614: {
    tokenMessenger: "0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5",
    messageTransmitter: "0xaCF1ceeF35caAc005e15888dDb8A3515C41B4872",
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
var NEXUS_VAULT_ADDRESS = "0xa043E3380B32FDB0F9BBD225D71ab2811600b56C";
var ARC_TESTNET_CHAIN_ID = 5042002;
var CIRCLE_API_BASE_URL = "https://iris-api-sandbox.circle.com";

// src/components/NexusPayment.tsx
import { useAccount, useChainId } from "wagmi";
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
    name: "handleCctpPayment",
    inputs: [
      { name: "message", type: "bytes" },
      { name: "attestation", type: "bytes" }
    ],
    outputs: [],
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
      { name: "hookData", type: "bytes" }
    ],
    outputs: [{ name: "nonce", type: "uint64" }],
    stateMutability: "nonpayable"
  }
];

// src/hooks/useDirectPayment.ts
function useDirectPayment() {
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const { writeContractAsync } = useWriteContract();
  const executePayment = async (params) => {
    try {
      setError(null);
      setStatus("approving");
      const approveTxHash = await writeContractAsync({
        address: params.usdcAddress,
        abi: USDC_ABI,
        functionName: "approve",
        args: [NEXUS_VAULT_ADDRESS, params.amount]
      });
      setStatus("approving");
      setStatus("finalizing");
      const payTxHash = await writeContractAsync({
        address: NEXUS_VAULT_ADDRESS,
        abi: NEXUS_VAULT_ABI,
        functionName: "pay",
        args: [params.amount, params.merchant, params.orderId]
      });
      setStatus("success");
      return payTxHash;
    } catch (err) {
      const error2 = err instanceof Error ? err : new Error("Payment failed");
      setError(error2);
      setStatus("error");
      throw error2;
    }
  };
  return {
    executePayment,
    status,
    error,
    isLoading: status !== "idle" && status !== "success" && status !== "error"
  };
}

// src/hooks/useCCTPBridge.ts
import { useState as useState2 } from "react";
import { useWriteContract as useWriteContract2, usePublicClient } from "wagmi";
import { parseAbiParameters, encodeAbiParameters } from "viem";
import { privateKeyToAccount } from "viem/accounts";

// src/utils/cctp.ts
async function waitForAttestation(messageHash, maxRetries = 60, retryInterval = 2e4) {
  let retries = 0;
  while (retries < maxRetries) {
    try {
      const response = await fetch(
        `${CIRCLE_API_BASE_URL}/v2/attestations/${messageHash}`
      );
      if (!response.ok) {
        if (response.status === 404) {
          retries++;
          await new Promise((resolve) => setTimeout(resolve, retryInterval));
          continue;
        }
        throw new Error(`Attestation API error: ${response.statusText}`);
      }
      const data = await response.json();
      if (data.status === "complete" && data.attestation) {
        return data.attestation;
      }
      retries++;
      await new Promise((resolve) => setTimeout(resolve, retryInterval));
    } catch (error) {
      console.error("Error fetching attestation:", error);
      retries++;
      await new Promise((resolve) => setTimeout(resolve, retryInterval));
    }
  }
  throw new Error("Attestation timeout - exceeded maximum retries");
}
function addressToBytes32(address) {
  const hex = address.slice(2).padStart(64, "0");
  return `0x${hex}`;
}

// src/hooks/useCCTPBridge.ts
function useCCTPBridge() {
  const [status, setStatus] = useState2("idle");
  const [error, setError] = useState2(null);
  const [currentStep, setCurrentStep] = useState2("");
  const { writeContractAsync } = useWriteContract2();
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
      const approveTxHash = await writeContractAsync({
        address: chainConfig.usdc,
        abi: USDC_ABI,
        functionName: "approve",
        args: [chainConfig.tokenMessenger, params.amount]
      });
      console.log("Approval tx:", approveTxHash);
      setCurrentStep("Preparing hook data...");
      const hookData = encodeAbiParameters(
        parseAbiParameters("address, string"),
        [params.merchant, params.orderId]
      );
      setStatus("burning");
      setCurrentStep("Burning USDC on source chain...");
      const destinationDomain = CCTP_CONTRACTS[ARC_TESTNET_CHAIN_ID].domain;
      const mintRecipient = addressToBytes32(NEXUS_VAULT_ADDRESS);
      const destinationCaller = addressToBytes32(NEXUS_VAULT_ADDRESS);
      const burnTxHash = await writeContractAsync({
        address: chainConfig.tokenMessenger,
        abi: TOKEN_MESSENGER_ABI,
        functionName: "depositForBurnWithHook",
        args: [
          params.amount,
          destinationDomain,
          mintRecipient,
          chainConfig.usdc,
          destinationCaller,
          hookData
        ]
      });
      console.log("Burn tx:", burnTxHash);
      setCurrentStep("Fetching transaction receipt...");
      if (!publicClient) {
        throw new Error("Public client not available");
      }
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: burnTxHash,
        confirmations: 1
      });
      setStatus("attesting");
      setCurrentStep("Waiting for Circle attestation (~20 seconds)...");
      const messageHash = burnTxHash;
      const attestation = await waitForAttestation(messageHash);
      console.log("Attestation received");
      setStatus("finalizing");
      setCurrentStep("Finalizing payment on Arc Testnet...");
      const operatorAccount = privateKeyToAccount(params.operatorPrivateKey);
      const arcPublicClient = await import("viem").then(
        (m) => m.createPublicClient({
          chain: {
            id: ARC_TESTNET_CHAIN_ID,
            name: "Arc Testnet",
            network: "arc-testnet",
            nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
            rpcUrls: {
              default: { http: [process.env.ARC_TESTNET_RPC_URL || ""] },
              public: { http: [process.env.ARC_TESTNET_RPC_URL || ""] }
            }
          },
          transport: m.http()
        })
      );
      const arcWalletClient = await import("viem").then(
        (m) => m.createWalletClient({
          account: operatorAccount,
          chain: {
            id: ARC_TESTNET_CHAIN_ID,
            name: "Arc Testnet",
            network: "arc-testnet",
            nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
            rpcUrls: {
              default: { http: [process.env.ARC_TESTNET_RPC_URL || ""] },
              public: { http: [process.env.ARC_TESTNET_RPC_URL || ""] }
            }
          },
          transport: m.http()
        })
      );
      const message = receipt.logs[0]?.data || "0x";
      const finalizeTxHash = await arcWalletClient.writeContract({
        address: NEXUS_VAULT_ADDRESS,
        abi: NEXUS_VAULT_ABI,
        functionName: "handleCctpPayment",
        args: [message, attestation]
      });
      console.log("Finalize tx:", finalizeTxHash);
      setStatus("success");
      setCurrentStep("Payment successful!");
      return finalizeTxHash;
    } catch (err) {
      const error2 = err instanceof Error ? err : new Error("CCTP payment failed");
      setError(error2);
      setStatus("error");
      setCurrentStep("Payment failed");
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

// src/components/NexusPayment.tsx
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
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
    amountLabel = "Amount (USDC)",
    onSuccess,
    onError,
    onStatusChange
  } = props;
  const { address, chain } = useAccount();
  const chainId = useChainId();
  const [inputAmount, setInputAmount] = useState3("");
  const [txHash, setTxHash] = useState3(null);
  const directPayment = useDirectPayment();
  const cctpBridge = useCCTPBridge();
  const isDirectPayment = chainId === ARC_TESTNET_CHAIN_ID;
  const activeHook = isDirectPayment ? directPayment : cctpBridge;
  const currentStatus = activeHook.status;
  const currentError = activeHook.error;
  const handlePayment = async () => {
    try {
      if (!address || !chain) {
        throw new Error("Please connect your wallet");
      }
      const amount = mode === "fixed" ? fixedAmount : parseUnits(inputAmount, 6);
      if (amount === 0n) {
        throw new Error("Amount must be greater than 0");
      }
      if (minAmount && amount < minAmount) {
        throw new Error(`Amount must be at least ${Number(minAmount) / 1e6} USDC`);
      }
      if (maxAmount && amount > maxAmount) {
        throw new Error(`Amount must not exceed ${Number(maxAmount) / 1e6} USDC`);
      }
      const chainConfig = CCTP_CONTRACTS[chainId];
      if (!chainConfig) {
        throw new Error("Unsupported chain. Please switch to a supported network.");
      }
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
        resultTxHash = await cctpBridge.executePayment({
          amount,
          merchant: merchantAddress,
          orderId,
          sourceChainId: chainId,
          operatorPrivateKey
        });
      }
      setTxHash(resultTxHash);
      onSuccess?.(resultTxHash, amount);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Payment failed");
      onError?.(error);
    }
  };
  if (onStatusChange && currentStatus) {
    onStatusChange(currentStatus);
  }
  const isLoading = activeHook.isLoading;
  const isDisabled = !address || isLoading;
  const paymentType = isDirectPayment ? "Direct" : "Cross-chain";
  return /* @__PURE__ */ jsx("div", { className: `nexus-payment ${className}`, style: defaultStyles.container, children: /* @__PURE__ */ jsxs("div", { className: "nexus-payment-content", style: defaultStyles.content, children: [
    /* @__PURE__ */ jsx("h3", { style: defaultStyles.title, children: "Payment" }),
    mode === "fixed" ? /* @__PURE__ */ jsxs("div", { className: "amount-display", style: defaultStyles.amountDisplay, children: [
      /* @__PURE__ */ jsx("label", { style: defaultStyles.label, children: amountLabel }),
      /* @__PURE__ */ jsxs("div", { className: "fixed-amount", style: defaultStyles.fixedAmount, children: [
        fixedAmount ? (Number(fixedAmount) / 1e6).toFixed(2) : "0.00",
        " USDC"
      ] })
    ] }) : /* @__PURE__ */ jsxs("div", { className: "amount-input", style: defaultStyles.inputGroup, children: [
      /* @__PURE__ */ jsx("label", { htmlFor: "amount", style: defaultStyles.label, children: amountLabel }),
      /* @__PURE__ */ jsxs("div", { style: defaultStyles.inputWrapper, children: [
        /* @__PURE__ */ jsx(
          "input",
          {
            id: "amount",
            type: "number",
            step: "0.01",
            min: minAmount ? Number(minAmount) / 1e6 : 0,
            max: maxAmount ? Number(maxAmount) / 1e6 : void 0,
            value: inputAmount,
            onChange: (e) => setInputAmount(e.target.value),
            placeholder: "0.00",
            style: defaultStyles.input
          }
        ),
        /* @__PURE__ */ jsx("span", { className: "currency", style: defaultStyles.currency, children: "USDC" })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "chain-info", style: defaultStyles.chainInfo, children: /* @__PURE__ */ jsx("small", { children: chain ? /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx("strong", { children: chain.name }),
      /* @__PURE__ */ jsx("span", { style: defaultStyles.badge, children: paymentType })
    ] }) : "Connect your wallet to continue" }) }),
    currentStatus && currentStatus !== "idle" && currentStatus !== "error" && /* @__PURE__ */ jsxs("div", { className: "status-message", style: defaultStyles.statusMessage, children: [
      /* @__PURE__ */ jsx("div", { style: defaultStyles.spinner }),
      /* @__PURE__ */ jsx("span", { children: !isDirectPayment && cctpBridge.currentStep ? cctpBridge.currentStep : currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1) + "..." })
    ] }),
    currentError && /* @__PURE__ */ jsxs("div", { className: "error-message", style: defaultStyles.errorMessage, children: [
      "\u26A0\uFE0F ",
      currentError.message
    ] }),
    currentStatus === "success" && txHash && /* @__PURE__ */ jsxs("div", { className: "success-message", style: defaultStyles.successMessage, children: [
      "\u2705 Payment successful!",
      chain?.blockExplorers?.default && /* @__PURE__ */ jsx(
        "a",
        {
          href: `${chain.blockExplorers.default.url}/tx/${txHash}`,
          target: "_blank",
          rel: "noopener noreferrer",
          style: defaultStyles.link,
          children: "View transaction"
        }
      )
    ] }),
    /* @__PURE__ */ jsx(
      "button",
      {
        onClick: handlePayment,
        disabled: isDisabled,
        className: "payment-button",
        style: {
          ...defaultStyles.button,
          ...isDisabled ? defaultStyles.buttonDisabled : {}
        },
        children: !address ? "Connect Wallet" : isLoading ? "Processing..." : buttonText || (mode === "fixed" ? "Pay Now" : "Send Payment")
      }
    )
  ] }) });
}
var defaultStyles = {
  container: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    maxWidth: "400px",
    margin: "0 auto"
  },
  content: {
    padding: "24px",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    backgroundColor: "#ffffff"
  },
  title: {
    margin: "0 0 20px 0",
    fontSize: "20px",
    fontWeight: "600",
    color: "#111827"
  },
  amountDisplay: {
    marginBottom: "16px"
  },
  inputGroup: {
    marginBottom: "16px"
  },
  label: {
    display: "block",
    marginBottom: "8px",
    fontSize: "14px",
    fontWeight: "500",
    color: "#374151"
  },
  fixedAmount: {
    padding: "12px 16px",
    fontSize: "24px",
    fontWeight: "600",
    color: "#111827",
    backgroundColor: "#f9fafb",
    borderRadius: "8px",
    textAlign: "center"
  },
  inputWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center"
  },
  input: {
    width: "100%",
    padding: "12px 70px 12px 16px",
    fontSize: "16px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    outline: "none"
  },
  currency: {
    position: "absolute",
    right: "16px",
    color: "#6b7280",
    fontWeight: "500"
  },
  chainInfo: {
    marginBottom: "16px",
    padding: "8px 12px",
    backgroundColor: "#f3f4f6",
    borderRadius: "6px",
    fontSize: "13px",
    color: "#4b5563",
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },
  badge: {
    marginLeft: "8px",
    padding: "2px 8px",
    backgroundColor: "#dbeafe",
    color: "#1e40af",
    borderRadius: "4px",
    fontSize: "11px",
    fontWeight: "600",
    textTransform: "uppercase"
  },
  statusMessage: {
    marginBottom: "16px",
    padding: "12px",
    backgroundColor: "#eff6ff",
    border: "1px solid #bfdbfe",
    borderRadius: "8px",
    color: "#1e40af",
    fontSize: "14px",
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },
  errorMessage: {
    marginBottom: "16px",
    padding: "12px",
    backgroundColor: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: "8px",
    color: "#991b1b",
    fontSize: "14px"
  },
  successMessage: {
    marginBottom: "16px",
    padding: "12px",
    backgroundColor: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: "8px",
    color: "#166534",
    fontSize: "14px"
  },
  link: {
    marginLeft: "8px",
    color: "#2563eb",
    textDecoration: "underline"
  },
  button: {
    width: "100%",
    padding: "14px",
    fontSize: "16px",
    fontWeight: "600",
    color: "#ffffff",
    backgroundColor: "#2563eb",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "background-color 0.2s"
  },
  buttonDisabled: {
    backgroundColor: "#9ca3af",
    cursor: "not-allowed"
  },
  spinner: {
    width: "14px",
    height: "14px",
    border: "2px solid #bfdbfe",
    borderTopColor: "#2563eb",
    borderRadius: "50%",
    animation: "spin 1s linear infinite"
  }
};
export {
  ARC_TESTNET_CHAIN_ID,
  NEXUS_VAULT_ADDRESS,
  NexusPayment
};
//# sourceMappingURL=index.js.map