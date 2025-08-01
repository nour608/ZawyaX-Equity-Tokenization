import { useCallback } from "react";
import { useContractRead, useContractWrite } from "./useThirdweb";
import { EquityToken, FreelanceJob, UserProfile, ChatMessage } from "@/lib/types";

/**
 * Hook for equity token contract interactions
 */
export function useEquityToken(tokenAddress?: `0x${string}`) {
  // Read operations
  const { data: tokenInfo, isLoading: tokenLoading, refetch: refetchToken } = useContractRead<EquityToken>(
    'equityToken',
    'getTokenInfo',
    tokenAddress ? [tokenAddress] : [],
    !!tokenAddress
  );

  const { data: userBalance, isLoading: balanceLoading, refetch: refetchBalance } = useContractRead<bigint>(
    'equityToken',
    'balanceOf',
    tokenAddress ? [tokenAddress] : [], // In real implementation, would include user address
    !!tokenAddress
  );

  // Write operations
  const { execute: buyTokens, transaction: buyTransaction, reset: resetBuy } = useContractWrite(
    'equityToken',
    'buyTokens'
  );

  const { execute: sellTokens, transaction: sellTransaction, reset: resetSell } = useContractWrite(
    'equityToken',
    'sellTokens'
  );

  const { execute: transferTokens, transaction: transferTransaction, reset: resetTransfer } = useContractWrite(
    'equityToken',
    'transfer'
  );

  // Convenience methods
  const handleBuyTokens = useCallback(async (amount: bigint, maxPrice: bigint) => {
    await buyTokens(amount, maxPrice);
  }, [buyTokens]);

  const handleSellTokens = useCallback(async (amount: bigint, minPrice: bigint) => {
    await sellTokens(amount, minPrice);
  }, [sellTokens]);

  const handleTransferTokens = useCallback(async (to: `0x${string}`, amount: bigint) => {
    await transferTokens(to, amount);
  }, [transferTokens]);

  return {
    // Data
    tokenInfo: tokenInfo || null,
    userBalance: userBalance || BigInt(0),
    
    // Loading states
    isLoading: tokenLoading || balanceLoading,
    
    // Actions
    buyTokens: handleBuyTokens,
    sellTokens: handleSellTokens,
    transferTokens: handleTransferTokens,
    
    // Transaction states
    buyTransaction,
    sellTransaction,
    transferTransaction,
    
    // Utils
    refetch: () => {
      refetchToken();
      refetchBalance();
    },
    resetTransactions: () => {
      resetBuy();
      resetSell();
      resetTransfer();
    },
  };
}

/**
 * Hook for equity token factory contract interactions
 */
export function useEquityFactory() {
  // Read operations
  const { data: allTokens, isLoading, refetch, error } = useContractRead<EquityToken[]>(
    'factory',
    'getAllTokens'
  );

  // Write operations
  const { execute: createToken, transaction: createTransaction, reset: resetCreate } = useContractWrite(
    'factory',
    'createEquityToken'
  );

  const handleCreateToken = useCallback(async (
    name: string,
    symbol: string,
    totalSupply: bigint,
    price: bigint,
    description: string
  ) => {
    await createToken(name, symbol, totalSupply, price, description);
  }, [createToken]);

  return {
    // Data
    allTokens: allTokens || [],
    isLoading,
    error,
    
    // Actions
    createToken: handleCreateToken,
    
    // Transaction state
    createTransaction,
    
    // Utils
    refetch,
    resetTransaction: resetCreate,
  };
}

/**
 * Hook for user registry contract interactions
 */
export function useUserRegistry() {
  // Read operations
  const { data: userProfile, isLoading: profileLoading, refetch: refetchProfile, error } = useContractRead<UserProfile>(
    'userRegistry',
    'getUserProfile'
  );

  // Write operations
  const { execute: updateProfile, transaction: updateTransaction, reset: resetUpdate } = useContractWrite(
    'userRegistry',
    'updateProfile'
  );

  const { execute: registerUser, transaction: registerTransaction, reset: resetRegister } = useContractWrite(
    'userRegistry',
    'registerUser'
  );

  const handleUpdateProfile = useCallback(async (profileData: Partial<UserProfile>) => {
    await updateProfile(profileData);
  }, [updateProfile]);

  const handleRegisterUser = useCallback(async (name: string, bio: string) => {
    await registerUser(name, bio);
  }, [registerUser]);

  return {
    // Data
    userProfile: userProfile || null,
    isLoading: profileLoading,
    error,
    
    // Actions
    updateProfile: handleUpdateProfile,
    registerUser: handleRegisterUser,
    
    // Transaction states
    updateTransaction,
    registerTransaction,
    
    // Utils
    refetch: refetchProfile,
    resetTransactions: () => {
      resetUpdate();
      resetRegister();
    },
  };
}

/**
 * Hook for freelance contract interactions
 */
export function useFreelanceContract() {
  // Read operations
  const { data: allJobs, isLoading: jobsLoading, refetch: refetchJobs, error: allJobsError } = useContractRead<FreelanceJob[]>(
    'freelance',
    'getAllJobs'
  );

  const { data: myJobs, isLoading: myJobsLoading, refetch: refetchMyJobs, error: myJobsError } = useContractRead<FreelanceJob[]>(
    'freelance',
    'getMyJobs'
  );

  // Write operations
  const { execute: postJob, transaction: postTransaction, reset: resetPost } = useContractWrite(
    'freelance',
    'postJob'
  );

  const { execute: applyToJob, transaction: applyTransaction, reset: resetApply } = useContractWrite(
    'freelance',
    'applyToJob'
  );

  const { execute: completeJob, transaction: completeTransaction, reset: resetComplete } = useContractWrite(
    'freelance',
    'completeJob'
  );

  const handlePostJob = useCallback(async (
    title: string,
    description: string,
    budget: bigint,
    deadline: Date,
    skills: string[]
  ) => {
    await postJob(title, description, budget, Math.floor(deadline.getTime() / 1000), skills);
  }, [postJob]);

  const handleApplyToJob = useCallback(async (jobId: string, proposal: string) => {
    await applyToJob(jobId, proposal);
  }, [applyToJob]);

  const handleCompleteJob = useCallback(async (jobId: string) => {
    await completeJob(jobId);
  }, [completeJob]);

  return {
    // Data
    allJobs: allJobs || [],
    myJobs: myJobs || [],
    
    // Loading states
    isLoading: jobsLoading || myJobsLoading,
    error: allJobsError || myJobsError,
    
    // Actions
    postJob: handlePostJob,
    applyToJob: handleApplyToJob,
    completeJob: handleCompleteJob,
    
    // Transaction states
    postTransaction,
    applyTransaction,
    completeTransaction,
    
    // Utils
    refetch: () => {
      refetchJobs();
      refetchMyJobs();
    },
    resetTransactions: () => {
      resetPost();
      resetApply();
      resetComplete();
    },
  };
}

/**
 * Hook for chat contract interactions
 */
export function useChatContract() {
  // Read operations
  const { data: messages, isLoading: messagesLoading, refetch: refetchMessages } = useContractRead<ChatMessage[]>(
    'chat',
    'getMessages'
  );

  const { data: channels, isLoading: channelsLoading, refetch: refetchChannels } = useContractRead<string[]>(
    'chat',
    'getUserChannels'
  );

  // Write operations
  const { execute: sendMessage, transaction: sendTransaction, reset: resetSend } = useContractWrite(
    'chat',
    'sendMessage'
  );

  const { execute: createChannel, transaction: createTransaction, reset: resetCreate } = useContractWrite(
    'chat',
    'createChannel'
  );

  const handleSendMessage = useCallback(async (
    to: `0x${string}`,
    message: string,
    channelId?: string
  ) => {
    await sendMessage(to, message, channelId || '');
  }, [sendMessage]);

  const handleCreateChannel = useCallback(async (participants: `0x${string}`[]) => {
    await createChannel(participants);
  }, [createChannel]);

  return {
    // Data
    messages: messages || [],
    channels: channels || [],
    
    // Loading states
    isLoading: messagesLoading || channelsLoading,
    
    // Actions
    sendMessage: handleSendMessage,
    createChannel: handleCreateChannel,
    
    // Transaction states
    sendTransaction,
    createTransaction,
    
    // Utils
    refetch: () => {
      refetchMessages();
      refetchChannels();
    },
    resetTransactions: () => {
      resetSend();
      resetCreate();
    },
  };
}