'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContracts, usePublicClient } from 'wagmi';
import { parseAbiItem, formatUnits } from 'viem';
import { NEXUS_VAULT_ADDRESS, NEXUS_VAULT_ABI } from '../lib/contracts';

interface CampaignStats {
    id: bigint;
    referrerPct: bigint;
    rewardLimit: bigint;
    totalRewarded: bigint;
    isActive: boolean;
    successfulSales: number;
    estimatedVolume: bigint;
}

export function CampaignList() {
    const { address } = useAccount();
    const publicClient = usePublicClient();
    const [campaignIds, setCampaignIds] = useState<bigint[]>([]);
    const [stats, setStats] = useState<Record<string, { successfulSales: number; estimatedVolume: bigint }>>({});
    const [isLoadingLogs, setIsLoadingLogs] = useState(false);

    // 1. Fetch CampaignCreated logs to find user's campaigns
    useEffect(() => {
        if (!address || !publicClient) return;

        const fetchCampaigns = async () => {
            setIsLoadingLogs(true);
            try {
                const currentBlock = await publicClient.getBlockNumber();
                const fromBlock = currentBlock - 9000n > 0n ? currentBlock - 9000n : 0n;

                // Get all CampaignCreated events for this merchant
                const logs = await publicClient.getLogs({
                    address: NEXUS_VAULT_ADDRESS,
                    event: parseAbiItem('event CampaignCreated(uint256 indexed campaignId, address indexed merchant, uint256 referrerPct, uint256 rewardLimit)'),
                    args: {
                        merchant: address
                    },
                    fromBlock,
                });

                const ids = logs.map(log => log.args.campaignId!).sort((a, b) => Number(b - a)); // Newest first
                setCampaignIds(ids);

                // Fetch stats for these campaigns (RewardPaid events)
                // Note: For production, this should be done via an indexer or optimized
                const rewardLogs = await publicClient.getLogs({
                    address: NEXUS_VAULT_ADDRESS,
                    event: parseAbiItem('event RewardPaid(uint256 indexed campaignId, address indexed referrer, uint256 amount)'),
                    fromBlock,
                });

                const newStats: Record<string, { successfulSales: number; estimatedVolume: bigint }> = {};
                
                // Initialize stats
                ids.forEach(id => {
                    newStats[id.toString()] = { successfulSales: 0, estimatedVolume: 0n };
                });

                // Process reward logs
                // We iterate all rewards. In production filter by campaignIds in the query if possible (OR filter not standard in simple getLogs usually)
                rewardLogs.forEach(log => {
                    const cId = log.args.campaignId!.toString();
                    if (newStats[cId]) {
                        newStats[cId].successfulSales++;
                        
                        // Estimate volume: Reward = Amount * Pct / 100
                        // So Amount = Reward * 100 / Pct
                        // We need the Pct for this campaign to calculate exactly, 
                        // but we can't easily access it here without reading the contract first.
                        // For now, we'll store the accumulated reward and calculate the volume later 
                        // when we have the campaign details.
                        // Wait, let's just store the total reward here and imply volume later?
                        // Or simplistic: estimatedVolume += 0n (we'll fix this in render/calculation)
                    }
                });
                
                setStats(newStats);

            } catch (err) {
                console.error("Error fetching logs:", err);
            } finally {
                setIsLoadingLogs(false);
            }
        };

        fetchCampaigns();
    }, [address, publicClient]);

    // 2. Read details for each campaign found
    const { data: campaignDetails } = useReadContracts({
        contracts: campaignIds.map(id => ({
            address: NEXUS_VAULT_ADDRESS,
            abi: NEXUS_VAULT_ABI,
            functionName: 'campaigns',
            args: [id],
        })),
    });

    if (!address) return null;

    if (isLoadingLogs && campaignIds.length === 0) {
        return <div className="text-gray-400 text-sm animate-pulse">Loading campaigns...</div>;
    }

    if (campaignIds.length === 0) {
        return (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
                <p className="text-gray-400">You haven't created any campaigns yet.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {campaignIds.map((id, index) => {
                const detail = campaignDetails?.[index]?.result;
                const stat = stats[id.toString()];
                
                if (!detail) return null;
                
                const [referrerPct, merchant, rewardLimit, totalRewarded, isActive] = detail;
                
                // Calculate estimated volume based on totalRewarded
                // TotalRewarded = Volume * Pct / 100  =>  Volume = TotalRewarded * 100 / Pct
                const estimatedVolume = referrerPct > 0n 
                    ? (totalRewarded * 100n) / referrerPct 
                    : 0n;

                const successfulSales = stat?.successfulSales || 0;

                return (
                    <div key={id.toString()} className="bg-gray-900 border border-gray-800 rounded-xl p-6 transition hover:border-blue-500/30">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h4 className="font-bold text-white text-lg">Campaign #{id.toString()}</h4>
                                    <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                                        isActive 
                                            ? 'bg-green-500/10 text-green-400 ring-1 ring-green-500/20' 
                                            : 'bg-red-500/10 text-red-400 ring-1 ring-red-500/20'
                                    }`}>
                                        {isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                <p className="text-gray-400 text-sm">
                                    Referrer Fee: <span className="text-white">{referrerPct.toString()}%</span>
                                    <span className="mx-2">•</span>
                                    Limit: <span className="text-white">{formatUnits(rewardLimit, 6)} USDC</span>
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-500 mb-1">Total Rewards Paid</p>
                                <p className="text-xl font-bold text-white tracking-tight">
                                    {formatUnits(totalRewarded, 6)} USDC
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-800">
                             <div>
                                <p className="text-xs text-gray-500 mb-1">Successful Sales</p>
                                <p className="text-white font-medium">{successfulSales}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Est. Sales Volume</p>
                                <p className="text-white font-medium">{formatUnits(estimatedVolume, 6)} USDC</p>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-800 flex items-center justify-between">
                            <p className="text-xs text-gray-500">Referrer Params</p>
                            <button
                                onClick={() => {
                                    const params = `?campaign=${id.toString()}&ref=<YOUR_WALLET_ADDRESS>`;
                                    navigator.clipboard.writeText(params);
                                    // Could add toast here
                                    alert(`Copied: ${params}`);
                                }}
                                className="text-xs bg-gray-800 hover:bg-gray-700 text-blue-400 font-mono py-1.5 px-3 rounded-lg transition border border-gray-700 flex items-center gap-2"
                            >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                Copy Link Params
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
