"use client";

import React, { useState, ChangeEvent, FormEvent, useEffect } from "react";
import { useBlockchain } from "@/lib/blockchain/BlockchainContext";
import blockchainService from "@/lib/blockchain/contracts";
import { twJoin } from "tailwind-merge";
import { Loader } from "lucide-react";
import { useRouter } from "next/navigation";

interface BlockchainAuthProps {
  onLoginSuccess?: (address: string) => void;
  onRegisterSuccess?: (username: string) => void;
}

interface FormDataType {
  username: string;
  profilePhotoIPFS: string;
  bio: string;
}

export default function BlockchainAuth({
  onLoginSuccess,
  onRegisterSuccess,
}: BlockchainAuthProps) {
  const { isConnected, userAddress, userProfile, connect } = useBlockchain();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormDataType>({
    username: "",
    profilePhotoIPFS: "",
    bio: "",
  });
  const router = useRouter();

  // Handle redirection after component mount when userProfile exists
  useEffect(() => {
    if (userProfile && userProfile.exists) {
      // Using setTimeout to ensure this happens in the next event loop cycle
      const timeoutId = setTimeout(() => {
        router.push("/");
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [userProfile, router]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev: FormDataType) => ({ ...prev, [name]: value }));
  };

  const handleConnect = async () => {
    console.log("Connecting to MetaMask...");
    try {
      setLoading(true);
      await connect();
      if (onLoginSuccess && userAddress) {
        console.log("Connected address:", userAddress);
        onLoginSuccess(userAddress);
      }
    } catch (error) {
      console.error("Failed to connect:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    if (!isConnected) {
      alert("Please connect to MetaMask first");
      return;
    }

    try {
      setLoading(true);
      const { username, profilePhotoIPFS, bio } = formData;

      if (!username) {
        alert("Username is required");
        return;
      }

      // Call blockchain service to register user
      const success = await blockchainService.registerUser(
        username,
        profilePhotoIPFS || "ipfs://default",
        bio || ""
      );

      if (success) {
        alert("User registered successfully!");
        // Refresh user profile
        await connect();
        if (onRegisterSuccess) {
          onRegisterSuccess(username);
        }
      } else {
        alert("Failed to register user");
      }
    } catch (error) {
      console.error("Error registering user:", error);
      alert(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  // Render login button if not connected
  if (!isConnected) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] flex-col items-center justify-center p-4">
        <div>
          <button
            className={twJoin(
              "flex rounded-lg p-2 gap-2",
              loading
                ? "bg-theme-secondary-muted text-theme-primary"
                : "bg-theme-secondary"
            )}
            onClick={handleConnect}
            disabled={loading}
          >
            <p>{loading ? "Connecting..." : "Connect with MetaMask"}</p>
            <img
              className="w-6 h-6"
              src="MetaMask-icon-fox.svg"
              alt="MetaMask"
            />
          </button>
        </div>
      </div>
    );
  }

  // Render welcome message if user profile exists
  if (userProfile && userProfile.exists) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] flex-col items-center justify-center p-4">
        <div className="flex items-center gap-2">
          <p>Welcome, {userProfile.username}</p>
          <Loader className="animate-spin" />
        </div>
      </div>
    );
  }

  // Render registration form for connected users without a profile
  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col items-center justify-center p-4">
      <div className="bg-theme-secondary-muted rounded-lg p-6 w-full max-w-md shadow-lg">
        <p className="text-theme-primary mb-4">
          Connected Address: {userAddress}
        </p>
        <form onSubmit={handleRegister} className="space-y-4">
          <h3 className="text-xl font-bold text-theme-primary mb-4">
            Register New User
          </h3>

          <div className="space-y-2">
            <label className="block text-theme-primary font-medium">
              Username
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Enter a unique username"
              required
              className="w-full p-2 border border-theme-secondary-muted rounded-md bg-theme-bg text-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-accent"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-theme-primary font-medium">
              Profile Photo IPFS URI
            </label>
            <input
              type="text"
              name="profilePhotoIPFS"
              value={formData.profilePhotoIPFS}
              onChange={handleChange}
              placeholder="ipfs://... (optional)"
              className="w-full p-2 border border-theme-secondary-muted rounded-md bg-theme-bg text-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-accent"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-theme-primary font-medium">Bio</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Tell us about yourself... (optional)"
              rows={3}
              className="w-full p-2 border border-theme-secondary-muted rounded-md bg-theme-bg text-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-accent resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={twJoin(
              "w-full py-2 px-4 rounded-md font-medium transition-colors",
              loading
                ? "bg-theme-secondary-muted text-theme-primary cursor-not-allowed"
                : "bg-theme-accent text-theme-bg hover:bg-theme-accent/90"
            )}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader className="w-4 h-4 animate-spin" />
                Registering...
              </span>
            ) : (
              "Register"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
