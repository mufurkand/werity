"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import blockchainService, { ContractAddresses, UserProfile } from "./contracts";
import LandingPage from "@/components/landing-page";

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
  connect: (skipUserRequest?: boolean) => Promise<boolean>;
  disconnect: () => void;
  updateContractAddresses: (addresses: Partial<ContractAddresses>) => void;
}

const BlockchainContext = createContext<BlockchainContextType | undefined>(
  undefined
);

export function BlockchainProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true); // Start as true to check for existing connection
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [contractAddresses, setContractAddresses] = useState<
    Partial<ContractAddresses>
  >({});
  const [error, setError] = useState<string | null>(null);

  // Save connection state to localStorage
  const saveConnectionState = (connected: boolean, address: string | null) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("blockchain_connected", connected.toString());
      if (address) {
        localStorage.setItem("blockchain_address", address);
      } else {
        localStorage.removeItem("blockchain_address");
      }
    }
  };

  // Get connection state from localStorage
  const getSavedConnectionState = () => {
    if (typeof window !== "undefined") {
      const connected = localStorage.getItem("blockchain_connected") === "true";
      const address = localStorage.getItem("blockchain_address");
      return { connected, address };
    }
    return { connected: false, address: null };
  };

  // Initialize blockchain service
  const connect = async (skipUserRequest = false): Promise<boolean> => {
    try {
      setIsInitializing(true);
      setError(null);

      // If skipUserRequest is true, try to connect silently without requesting accounts
      const result = skipUserRequest 
        ? await blockchainService.initSilently()
        : await blockchainService.init();

      if (result) {
        const address = blockchainService.getUserAddress();
        setUserAddress(address);

        // Try to load user profile if registered
        if (address) {
          try {
            const profile = await blockchainService.getUserProfile(address);
            setUserProfile(profile);
          } catch (profileError) {
            console.error("Error loading profile:", profileError);
            // Don't fail the connection just because profile loading failed
          }
        }

        setIsConnected(true);
        saveConnectionState(true, address);
        return true;
      } else {
        setError("Failed to connect to blockchain");
        setIsConnected(false);
        saveConnectionState(false, null);
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
      saveConnectionState(false, null);
      return false;
    } finally {
      setIsInitializing(false);
    }
  };

  // Disconnect function
  const disconnect = () => {
    setIsConnected(false);
    setUserAddress(null);
    setUserProfile(null);
    setError(null);
    saveConnectionState(false, null);
  };

  // Update contract addresses
  const updateContractAddresses = (addresses: Partial<ContractAddresses>) => {
    setContractAddresses((prev: Partial<ContractAddresses>) => {
      const updated = { ...prev, ...addresses };
      blockchainService.updateContractAddresses(updated);
      return updated;
    });
  };

  // Auto-reconnection on app load
  useEffect(() => {
    const tryAutoReconnect = async () => {
      try {
        const { connected } = getSavedConnectionState();
        
        if (connected) {
          console.log("Attempting auto-reconnection...");
          const success = await connect(true); // Silent connection
          if (!success) {
            console.log("Auto-reconnection failed, user needs to connect manually");
            saveConnectionState(false, null);
          } else {
            console.log("Auto-reconnection successful");
          }
        } else {
          console.log("No previous connection found");
        }
      } catch (error) {
        console.error("Error during auto-reconnection:", error);
        saveConnectionState(false, null);
      } finally {
        setIsInitializing(false);
      }
    };

    tryAutoReconnect();
  }, []); // Only run on mount

  // Setup event listeners for account changes
  useEffect(() => {
    if (typeof window !== "undefined" && window.ethereum) {
      const handleAccountsChanged = async (accounts: string[]) => {
        if (accounts.length === 0) {
          setIsConnected(false);
          setUserAddress(null);
          setUserProfile(null);
          saveConnectionState(false, null);
        } else if (accounts[0] !== userAddress) {
          setUserAddress(accounts[0]);
          saveConnectionState(true, accounts[0]);

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

      const handleDisconnect = () => {
        console.log("MetaMask disconnected");
        setIsConnected(false);
        setUserAddress(null);
        setUserProfile(null);
        saveConnectionState(false, null);
      };

      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("disconnect", handleDisconnect);

      // Cleanup
      return () => {
        window.ethereum.removeListener(
          "accountsChanged",
          handleAccountsChanged
        );
        window.ethereum.removeListener("disconnect", handleDisconnect);
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
    disconnect,
    updateContractAddresses,
  };

  return (
    <BlockchainContext.Provider value={value}>
      {isConnected ? children : <LandingPage />}
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
