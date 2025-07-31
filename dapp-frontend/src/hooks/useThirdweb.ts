import { useState, useCallback, useEffect } from "react";
import { useReadContract, useSendTransaction } from "thirdweb/react";
import { getContractInstance, getActiveChain } from "@/lib/thirdweb";
import { FEATURE_FLAGS } from "@/lib/constants";

// Types
export interface UseContractReturn<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface UseTransactionReturn {
  execute: (...args: unknown[]) => Promise<void>;
  transaction: TransactionState;
  reset: () => void;
}

export interface TransactionState {
  status: 'idle' | 'pending' | 'success' | 'error';
  hash?: string;
  confirmations?: number;
  error?: string;
}

export interface UseProfileReturn {
  profile: any | null;
  isLoading: boolean;
  error: string | null;
  updateProfile: (data: any) => Promise<void>;
}

export interface UseWalletBalanceReturn {
  balance: bigint | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface UseTransactionHistoryReturn {
  transactions: any[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface UseGasEstimationReturn {
  estimateGas: (functionName: string, args: unknown[]) => Promise<bigint | null>;
  isLoading: boolean;
  error: string | null;
}

// Utility function to get error message
function getErrorMessage(error: any): string {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  if (error?.reason) return error.reason;
  return 'An unknown error occurred';
}

/**
 * Hook for reading from contracts
 */
export function useContractRead<T>(
  contractKey: keyof typeof import("@/lib/thirdweb").contracts,
  functionName: string,
  args: unknown[] = [],
  enabled: boolean = true
): UseContractReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const contract = getContractInstance(contractKey);

  const {
    data: contractData,
    isLoading: contractLoading,
    error: contractError,
    refetch: contractRefetch,
  } = useReadContract({
    contract: contract!,
    method: functionName,
    params: args,
    queryOptions: {
      enabled: enabled && !!contract,
    },
  });

  const refetch = useCallback(async () => {
    if (contract) {
      await contractRefetch();
    }
  }, [contract, contractRefetch]);

  useEffect(() => {
    setData(contractData as T);
    setIsLoading(contractLoading);
    setError(contractError ? getErrorMessage(contractError) : null);
  }, [contractData, contractLoading, contractError]);

  return { data, isLoading, error, refetch };
}

/**
 * Hook for writing to contracts with transaction state management
 */
export function useContractWrite(
  contractKey: keyof typeof import("@/lib/thirdweb").contracts,
  functionName: string
): UseTransactionReturn {
  const [transaction, setTransaction] = useState<TransactionState>({
    status: 'idle',
  });

  const contract = getContractInstance(contractKey);
  const { mutate: sendTransaction } = useSendTransaction();

  const execute = useCallback(async (...args: unknown[]) => {
    if (!contract) {
      setTransaction({ 
        status: 'error', 
        error: `Contract ${contractKey} not available` 
      });
      return;
    }

    try {
      setTransaction({ status: 'pending' });

      const tx = await import("thirdweb").then(({ prepareContractCall }) =>
        prepareContractCall({
          contract,
          method: functionName,
          params: args,
        })
      );

      sendTransaction(tx, {
        onSuccess: (receipt) => {
          setTransaction({
            status: 'success',
            hash: receipt.transactionHash,
            confirmations: 1,
          });
        },
        onError: (error) => {
          setTransaction({
            status: 'error',
            error: getErrorMessage(error),
          });
        },
      });
    } catch (error) {
      setTransaction({
        status: 'error',
        error: getErrorMessage(error),
      });
    }
  }, [contract, functionName, sendTransaction]);

  const reset = useCallback(() => {
    setTransaction({ status: 'idle' });
  }, []);

  return { execute, transaction, reset };
}

/**
 * Hook for user profile management
 */
export function useProfile(): UseProfileReturn {
  const [profile, setProfile] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateProfile = useCallback(async (data: any) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // This would typically call a contract function to update profile
      setProfile(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { profile, isLoading, error, updateProfile };
}

/**
 * Hook for wallet balance
 */
export function useWalletBalance(): UseWalletBalanceReturn {
  const [balance, setBalance] = useState<bigint | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { getBalance } = await import("thirdweb");
      const { getActiveAccount } = await import("thirdweb/react");
      const account = getActiveAccount();
      
      if (account) {
        const bal = await getBalance({
          address: account.address,
          chain: await getActiveChain(),
        });
        setBalance(bal.value);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { balance, isLoading, error, refetch };
}

/**
 * Hook for transaction history
 */
export function useTransactionHistory(): UseTransactionHistoryReturn {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // This would typically fetch transaction history from a block explorer API
      setTransactions([]);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { transactions, isLoading, error, refetch };
}

/**
 * Hook for gas estimation
 */
export function useGasEstimation(): UseGasEstimationReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const estimateGas = useCallback(async (
    functionName: string,
    args: unknown[]
  ): Promise<bigint | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // This would typically estimate gas for a contract call
      return BigInt(21000); // Default gas limit
    } catch (err) {
      setError(getErrorMessage(err));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { estimateGas, isLoading, error };
}