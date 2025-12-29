import { useQuery } from "@tanstack/react-query";
import { getMintInfo2022 } from "../services/solanaConfig";

// V2 Implementation: Real Solana SPL 2022 Data
// Uses TanStack Query to fetch and cache mint info.

export const useSolanaMintInfo = (mintAddress: string) => {
  return useQuery({
    queryKey: ['solana-mint', mintAddress],
    queryFn: () => getMintInfo2022(mintAddress),
    enabled: !!mintAddress,
    staleTime: 60000,
  });
};
