"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import blockchainService, { ContractAddresses, UserProfile } from "./contracts";

// Add ethereum to window type
declare global {
  interface Window {
    ethereum: any;
  }
}

interface BlockchainContextType {
  isConnected: boolean;
  isInitializing: boolean;
  userAddress: string | null;
  userProfile: UserProfile | null;
  contractAddresses: Partial<ContractAddresses>;
  error: string | null;
  connect: () => Promise<boolean>;
  updateContractAddresses: (addresses: Partial<ContractAddresses>) => void;
}

const BlockchainContext = createContext<BlockchainContextType | undefined>(
  undefined
);

export function BlockchainProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [contractAddresses, setContractAddresses] = useState<
    Partial<ContractAddresses>
  >({});
  const [error, setError] = useState<string | null>(null);

  // Initialize blockchain service
  const connect = async (): Promise<boolean> => {
    try {
      setIsInitializing(true);
      setError(null);

      const result = await blockchainService.init();

      if (result) {
        const address = blockchainService.getUserAddress();
        setUserAddress(address);

        // Try to load user profile if registered
        if (address) {
          try {
            console.log(">>inside of try");
            const profile = await blockchainService.getUserProfile(address);
            setUserProfile(profile);
          } catch (profileError) {
            console.log(">>inside of catch");
            console.error("Error loading profile:", profileError);
            // Don't fail the connection just because profile loading failed
          }
        }
        console.log(">>outside of try");

        setIsConnected(true);
        return true;
      } else {
        setError("Failed to connect to blockchain");
        setIsConnected(false);
        return false;
      }
    } catch (err: any) {
      // Extract the most useful error message
      let errorMessage = "Error connecting to blockchain";

      if (err.message) {
        errorMessage = err.message;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === "string") {
        errorMessage = err;
      } else {
        errorMessage = "Unknown error connecting to blockchain";
      }

      // Check for common issues
      if (errorMessage.includes("node is running")) {
        errorMessage =
          "Unable to connect to the blockchain. Please make sure your Hardhat node is running.";
      } else if (errorMessage.includes("user rejected")) {
        errorMessage =
          "Connection canceled. You rejected the MetaMask connection request.";
      } else if (errorMessage.includes("MetaMask is not installed")) {
        errorMessage =
          "MetaMask is not installed. Please install the MetaMask browser extension.";
      }

      setError(errorMessage);
      setIsConnected(false);
      return false;
    } finally {
      setIsInitializing(false);
    }
  };

  // Update contract addresses
  const updateContractAddresses = (addresses: Partial<ContractAddresses>) => {
    setContractAddresses((prev: Partial<ContractAddresses>) => {
      const updated = { ...prev, ...addresses };
      blockchainService.updateContractAddresses(updated);
      return updated;
    });
  };

  // Setup event listeners for account changes
  useEffect(() => {
    if (typeof window !== "undefined" && window.ethereum) {
      const handleAccountsChanged = async (accounts: string[]) => {
        if (accounts.length === 0) {
          setIsConnected(false);
          setUserAddress(null);
          setUserProfile(null);
        } else if (accounts[0] !== userAddress) {
          setUserAddress(accounts[0]);

          // Load profile for new address
          try {
            const profile = await blockchainService.getUserProfile(accounts[0]);
            setUserProfile(profile);
          } catch (err) {
            console.error("Error loading user profile:", err);
            setUserProfile(null);
          }
        }
      };

      window.ethereum.on("accountsChanged", handleAccountsChanged);

      // Cleanup
      return () => {
        window.ethereum.removeListener(
          "accountsChanged",
          handleAccountsChanged
        );
      };
    }
  }, [userAddress]);

  const value = {
    isConnected,
    isInitializing,
    userAddress,
    userProfile,
    contractAddresses,
    error,
    connect,
    updateContractAddresses,
  };

  return (
    <BlockchainContext.Provider value={value}>
      {children}
    </BlockchainContext.Provider>
  );
}

export function useBlockchain() {
  const context = useContext(BlockchainContext);
  if (context === undefined) {
    throw new Error("useBlockchain must be used within a BlockchainProvider");
  }
  return context;
}
