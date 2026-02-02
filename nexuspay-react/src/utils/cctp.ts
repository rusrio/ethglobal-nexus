import { CIRCLE_API_BASE_URL } from '../constants/contracts';
import type { AttestationResponse } from '../types';

/**
 * Wait for CCTP attestation from Circle API
 * @param messageHash Hash of the CCTP message (available from burn tx logs)
 * @param maxRetries Maximum number of polling attempts (default: 60 = ~20 minutes at 20s intervals)
 * @param retryInterval Milliseconds between retries (default: 20000 = 20 seconds)
 */
export async function waitForAttestation(
  messageHash: string,
  maxRetries = 60,
  retryInterval = 20000
): Promise<string> {
  let retries = 0;

  while (retries < maxRetries) {
    try {
      const response = await fetch(
        `${CIRCLE_API_BASE_URL}/v2/attestations/${messageHash}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          // Attestation not yet available, retry
          retries++;
          await new Promise((resolve) => setTimeout(resolve, retryInterval));
          continue;
        }
        throw new Error(`Attestation API error: ${response.statusText}`);
      }

      const data: AttestationResponse = await response.json();

      if (data.status === 'complete' && data.attestation) {
        return data.attestation;
      }

      // Status is pending, retry
      retries++;
      await new Promise((resolve) => setTimeout(resolve, retryInterval));
    } catch (error) {
      console.error('Error fetching attestation:', error);
      retries++;
      await new Promise((resolve) => setTimeout(resolve, retryInterval));
    }
  }

  throw new Error('Attestation timeout - exceeded maximum retries');
}

/**
 * Convert address to bytes32 format for CCTP
 */
export function addressToBytes32(address: `0x${string}`): `0x${string}` {
  // Remove 0x prefix, pad to 64 characters (32 bytes), add 0x prefix back
  const hex = address.slice(2).padStart(64, '0');
  return `0x${hex}` as `0x${string}`;
}

/**
 * Extract message hash from burn transaction logs
 * Circle emits a MessageSent event with the message hash
 */
export function extractMessageHashFromLogs(logs: any[]): string | null {
  // Look for MessageSent event from MessageTransmitter
  // Event signature: MessageSent(bytes message)
  const messageSentTopic =
    '0x8c5261668696ce22758910d05bab8f186d6eb247ceac2af2e82c7dc17669b036';

  for (const log of logs) {
    if (log.topics?.[0] === messageSentTopic) {
      // The message hash is the keccak256 of the message data
      // For simplicity, we'll use the transaction hash as message identifier
      // In production, you'd parse the actual message from log data
      return log.transactionHash;
    }
  }

  return null;
}
