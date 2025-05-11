"use client";

import React, { useState, ChangeEvent, FormEvent } from "react";
import { useBlockchain } from "@/lib/blockchain/BlockchainContext";
import blockchainService from "@/lib/blockchain/contracts";

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

  return (
    <div>
      {!isConnected ? (
        <div>
          <h3>Connect to Your Wallet</h3>
          <button onClick={handleConnect} disabled={loading}>
            {loading ? "Connecting..." : "Connect with MetaMask"}
          </button>
        </div>
      ) : (
        <div>
          <div>
            <p>Connected Address: {userAddress}</p>
          </div>

          {userProfile && userProfile.exists ? (
            <div>
              <h3>Welcome, {userProfile.username}</h3>
              <p>Your account is already registered.</p>
            </div>
          ) : (
            <form onSubmit={handleRegister}>
              <h3>Register New User</h3>

              <div>
                <label>Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Enter a unique username"
                  required
                />
              </div>

              <div>
                <label>Profile Photo IPFS URI</label>
                <input
                  type="text"
                  name="profilePhotoIPFS"
                  value={formData.profilePhotoIPFS}
                  onChange={handleChange}
                  placeholder="ipfs://... (optional)"
                />
              </div>

              <div>
                <label>Bio</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="Tell us about yourself... (optional)"
                  rows={3}
                />
              </div>

              <button type="submit" disabled={loading}>
                {loading ? "Registering..." : "Register"}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
