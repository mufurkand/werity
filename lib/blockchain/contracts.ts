import { ethers } from "ethers";

// Load deployment data from JSON
const deploymentData = {
  accountManager: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  postManager: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
  commentManager: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
  followManager: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
  moderationManager: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
  socialToken: "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707",
  tokenManager: "0x0165878A594ca255338adfa4d48449f69242Eb8F",
  postNFT: "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853",
  postMarketplace: "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6",
  socialMediaManager: "0x8A791620dd6260079BF849Dc5567aDC3F2FdC318",
};

// This function helps detect and adapt to redeployed contracts
const getDeploymentData = () => {
  if (typeof window === "undefined") return deploymentData;

  try {
    // First, try to load from localStorage (has highest priority)
    const storedAddresses = localStorage.getItem("contract_addresses");
    if (storedAddresses) {
      const parsedAddresses = JSON.parse(storedAddresses);
      console.log("Using contract addresses from localStorage");
      return parsedAddresses;
    }

    // Second, try to load from deployments file
    try {
      // Using dynamic import to load the deployment file
      import("../../deployments/contracts.json")
        .then((deploymentFile) => {
          console.log("Found deployment file, updating contract addresses");
          localStorage.setItem(
            "contract_addresses",
            JSON.stringify(deploymentFile)
          );
          // We need to reload to use the new addresses
          window.location.reload();
        })
        .catch((err) => {
          console.warn(
            "No deployment file found, using default addresses",
            err
          );
          // If no deployment file, use the default addresses
          localStorage.setItem(
            "contract_addresses",
            JSON.stringify(deploymentData)
          );
        });
    } catch (importError) {
      console.warn("Error importing deployment file:", importError);
    }

    // If all else fails, use the hardcoded deploymentData
    console.log("Using default contract addresses");
    return deploymentData;
  } catch (e) {
    console.warn("Error accessing localStorage:", e);
    return deploymentData;
  }
};

// Define required network
const REQUIRED_NETWORK = {
  chainId: "0x539", // 1337 in hex
  chainName: "Hardhat Local",
  rpcUrls: [
    typeof window !== "undefined" && process.env.NEXT_PUBLIC_RPC_URL
      ? process.env.NEXT_PUBLIC_RPC_URL
      : "http://localhost:8545",
  ],
};

// Minimal ABIs for the main functions we need
const AccountManagerABI = [
  "function registerUser(string calldata _username, string calldata _profilePhotoIPFS, string calldata _bio) external",
  "function updateProfile(string calldata _profilePhotoIPFS, string calldata _bio) external",
  "function getProfileByAddress(address _userAddress) external view returns (tuple(string username, string profilePhotoIPFS, string bio, bool exists, uint64 registrationTime))",
];

// Define PostManager ABI
const PostManagerABI = [
  "function createPost(string calldata _contentIPFS) external returns (uint256)",
  "function getPostsByUser(address _userAddress) external view returns (uint256[])",
  "function getPostById(uint256 _postId) external view returns (tuple(address author, string contentIPFS, uint64 timestamp, uint32 likesCount, bool isDeleted))",
  "function likePost(uint256 _postId) external",
  "function unlikePost(uint256 _postId) external",
  "function deletePost(uint256 _postId) external",
  "function hasLiked(address _userAddress, uint256 _postId) external view returns (bool)",
  "function getRecentPosts(uint256 _offset, uint256 _limit) external view returns (tuple(address author, string contentIPFS, uint64 timestamp, uint32 likesCount, bool isDeleted)[] posts_, uint256[] postIds)",
  "function getPostCount() external view returns (uint256)",
];

// Define CommentManager ABI
const CommentManagerABI = [
  "function createComment(uint256 _postId, string calldata _content) external returns (uint256)",
  "function getCommentsByPostId(uint256 _postId, uint256 _offset, uint256 _limit) external view returns (tuple(uint256 postId, address author, string content, uint64 timestamp, uint32 likesCount, bool isDeleted)[] comments_, uint256[] commentIds)",
  "function getCommentById(uint256 _commentId) external view returns (tuple(uint256 postId, address author, string content, uint64 timestamp, uint32 likesCount, bool isDeleted))",
  "function likeComment(uint256 _commentId) external",
  "function unlikeComment(uint256 _commentId) external",
  "function deleteComment(uint256 _commentId) external",
  "function hasLikedComment(address _userAddress, uint256 _commentId) external view returns (bool)",
  "event CommentCreated(uint256 indexed commentId, uint256 indexed postId, address indexed author, string content, uint64 timestamp)",
];

// Define FollowManager ABI
const FollowManagerABI = [
  "function follow(address _userToFollow) external",
  "function unfollow(address _userToUnfollow) external",
  "function checkFollowing(address _follower, address _followed) external view returns (bool)",
  "function getFollowing(address _user, uint256 _offset, uint256 _limit) external view returns (address[])",
  "function getFollowers(address _user, uint256 _offset, uint256 _limit) external view returns (address[])",
  "function getFollowingCount(address _user) external view returns (uint32)",
  "function getFollowersCount(address _user) external view returns (uint32)",
];

// Define ModerationManager ABI
const ModerationManagerABI = [
  "function addModerator(address _moderator) external",
  "function removeModerator(address _moderator) external",
  "function banUser(address _user, string calldata _reason) external",
  "function unbanUser(address _user) external",
  "function muteUser(address _user, string calldata _reason) external",
  "function unmuteUser(address _user) external",
  "function removePost(uint256 _postId, string calldata _reason) external",
  "function removeComment(uint256 _commentId, string calldata _reason) external",
  "function isUserBanned(address _user) external view returns (bool)",
  "function isUserMuted(address _user) external view returns (bool)",
  "function isModerator(address _user) external view returns (bool)",
];

// Define ABIs for the contracts with minimal interfaces needed for our functions
const ABIs = {
  SocialMediaManager: [],
  AccountManager: AccountManagerABI,
  PostManager: PostManagerABI,
  CommentManager: CommentManagerABI,
  FollowManager: FollowManagerABI,
  ModerationManager: ModerationManagerABI,
  SocialToken: [
    "function balanceOf(address account) external view returns (uint256)",
    "function transfer(address to, uint256 amount) external returns (bool)",
    "function totalSupply() external view returns (uint256)",
  ],
  TokenManager: [],
  PostNFT: [],
  PostMarketplace: [],
};

export interface ContractAddresses {
  socialMediaManager: string;
  accountManager: string;
  postManager: string;
  commentManager: string;
  followManager: string;
  moderationManager: string;
  socialToken: string;
  tokenManager: string;
  postNFT: string;
  postMarketplace: string;
}

// UserProfile interface for type safety
export interface UserProfile {
  username: string;
  profilePhotoIPFS: string;
  bio: string;
  exists: boolean;
  registrationTime: number;
}

// Add ethereum to window type
declare global {
  interface Window {
    ethereum: any;
  }
}

// Load contract addresses from deployment data
let contractAddresses: ContractAddresses = getDeploymentData();

export class BlockchainService {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.Signer | null = null;
  private contracts: Record<string, ethers.Contract> = {};
  private initialized = false;
  private userAddress: string | null = null;
  private networkChecked = false;
  private safeContractCall: (method: Function, ...args: any[]) => Promise<any> =
    async (method: Function, ...args: any[]) => {
      try {
        return await method(...args);
      } catch (error: any) {
        // Check if the error is about invalid block tag
        if (
          error &&
          error.message &&
          error.message.includes("invalid block tag")
        ) {
          console.warn("Invalid block tag error:", error.message);
          // This likely means the blockchain has been reset but we're using old contract addresses
          console.error(
            "Invalid block tag error. This usually happens when the blockchain node has been reset."
          );

          // Reset contract addresses and reload the page
          this.resetContractAddresses();
          throw new Error(
            "Your blockchain has been reset. Please redeploy your contracts and reload the page."
          );
        }
        throw error;
      }
    };

  // Helper method to check if a specific contract is initialized
  private isContractInitialized(contractName: string): boolean {
    const contract = this.contracts[contractName];
    if (
      !contract ||
      !contract.address ||
      contract.address === "0x0000000000000000000000000000000000000000"
    ) {
      console.error(`Contract ${contractName} is not properly initialized`);
      return false;
    }
    return true;
  }

  // Check if the connected network is correct
  private async checkAndSwitchNetwork(): Promise<boolean> {
    if (!window.ethereum) return false;

    try {
      // Get current chain ID
      const chainId = await window.ethereum.request({ method: "eth_chainId" });

      // If already on the correct network, return true
      if (chainId === REQUIRED_NETWORK.chainId) {
        console.log("Already connected to the correct network");
        return true;
      }

      // Try to switch to the required network
      try {
        console.log("Switching to Hardhat network...");
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: REQUIRED_NETWORK.chainId }],
        });
        return true;
      } catch (switchError: any) {
        // This error code indicates that the chain has not been added to MetaMask
        if (switchError.code === 4902) {
          try {
            console.log("Adding Hardhat network to MetaMask...");
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: REQUIRED_NETWORK.chainId,
                  chainName: REQUIRED_NETWORK.chainName,
                  rpcUrls: REQUIRED_NETWORK.rpcUrls,
                  nativeCurrency: {
                    name: "ETH",
                    symbol: "ETH",
                    decimals: 18,
                  },
                },
              ],
            });
            return true;
          } catch (addError) {
            console.error("Error adding network:", addError);
            return false;
          }
        }
        console.error("Error switching network:", switchError);
        return false;
      }
    } catch (error) {
      console.error("Error checking network:", error);
      return false;
    }
  }

  // Check if the blockchain node is running
  private async checkNodeConnection(): Promise<boolean> {
    if (!this.provider) return false;

    try {
      // Try to get the block number
      await this.provider.getBlockNumber();
      console.log("Successfully connected to blockchain node");
      return true;
    } catch (error) {
      console.error("Error connecting to blockchain node:", error);
      throw new Error(
        "Unable to connect to blockchain node. Please make sure your Hardhat node is running."
      );
    }
  }

  // Initialize the blockchain service
  async init(): Promise<boolean> {
    try {
      // Check if MetaMask is installed
      if (typeof window !== "undefined" && window.ethereum) {
        // Check and switch to the correct network
        if (!this.networkChecked) {
          const networkSwitched = await this.checkAndSwitchNetwork();
          if (!networkSwitched) {
            console.error("Failed to switch to the correct network");
            return false;
          }
          this.networkChecked = true;
        }

        // Create a Web3Provider
        this.provider = new ethers.BrowserProvider(window.ethereum);

        // Check blockchain node connection
        await this.checkNodeConnection();

        // Request access to accounts
        await window.ethereum.request({ method: "eth_requestAccounts" });

        // Get the signer
        this.signer = await this.provider.getSigner();
        this.userAddress = await this.signer.getAddress();

        // Initialize contracts
        this.initContracts();

        this.initialized = true;
        return true;
      } else {
        console.error("MetaMask not installed");
        throw new Error(
          "MetaMask is not installed. Please install MetaMask to use this application."
        );
      }
    } catch (error) {
      console.error("Error initializing blockchain service:", error);
      return false;
    }
  }

  // Initialize all contracts
  private initContracts() {
    if (!this.signer) {
      console.error("Signer not initialized");
      return;
    }

    try {
      // Check if contract addresses are valid
      Object.entries(contractAddresses).forEach(([name, address]) => {
        if (
          !address ||
          address === "" ||
          address === "0x0000000000000000000000000000000000000000"
        ) {
          console.warn(
            `Warning: ${name} contract address is empty or invalid: ${address}`
          );
        }
      });

      console.log("Initializing contracts with addresses:", contractAddresses);

      // Initialize each contract with its ABI and address
      this.contracts.socialMediaManager = new ethers.Contract(
        contractAddresses.socialMediaManager,
        ABIs.SocialMediaManager,
        this.signer
      );

      this.contracts.accountManager = new ethers.Contract(
        contractAddresses.accountManager,
        ABIs.AccountManager,
        this.signer
      );

      this.contracts.postManager = new ethers.Contract(
        contractAddresses.postManager,
        ABIs.PostManager,
        this.signer
      );

      this.contracts.commentManager = new ethers.Contract(
        contractAddresses.commentManager,
        ABIs.CommentManager,
        this.signer
      );

      this.contracts.followManager = new ethers.Contract(
        contractAddresses.followManager,
        ABIs.FollowManager,
        this.signer
      );

      this.contracts.moderationManager = new ethers.Contract(
        contractAddresses.moderationManager,
        ABIs.ModerationManager,
        this.signer
      );
      this.contracts.socialToken = new ethers.Contract(
        contractAddresses.socialToken,
        ABIs.SocialToken,
        this.signer
      );
      console.log(
        "Initialized SocialToken contract with address:",
        contractAddresses.socialToken
      );

      this.contracts.tokenManager = new ethers.Contract(
        contractAddresses.tokenManager,
        ABIs.TokenManager,
        this.signer
      );

      this.contracts.postNFT = new ethers.Contract(
        contractAddresses.postNFT,
        ABIs.PostNFT,
        this.signer
      );

      this.contracts.postMarketplace = new ethers.Contract(
        contractAddresses.postMarketplace,
        ABIs.PostMarketplace,
        this.signer
      );

      console.log("Contracts initialized successfully");
    } catch (error) {
      console.error("Error initializing contracts:", error);
    }
  }

  // Update contract addresses
  updateContractAddresses(addresses: Partial<ContractAddresses>) {
    contractAddresses = { ...contractAddresses, ...addresses };
    // Store updated addresses in local storage
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(
          "contract_addresses",
          JSON.stringify(contractAddresses)
        );
      } catch (e) {
        console.warn("Error saving to localStorage:", e);
      }
    }
    if (this.signer) {
      this.initContracts();
    }
  }

  // Reset contract addresses in case of blockchain reset
  resetContractAddresses() {
    console.log("Resetting contract addresses due to blockchain reset");

    // Clear local storage
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("contract_addresses");
      } catch (e) {
        console.warn("Error clearing localStorage:", e);
      }
    }

    // Force a page reload to make user re-deploy contracts
    if (typeof window !== "undefined") {
      alert(
        "Your blockchain node has been reset. Please redeploy your contracts and reload the page."
      );
      window.location.reload();
    }
  }

  // Check if the service is initialized
  isInitialized(): boolean {
    return this.initialized;
  }

  // Get user address
  getUserAddress(): string | null {
    return this.userAddress;
  }

  // Get contract instances
  getContracts() {
    return this.contracts;
  }

  // Get a specific contract
  getContract(name: string): ethers.Contract | null {
    return this.contracts[name] || null;
  }

  // Account Manager Methods
  async registerUser(
    username: string,
    profilePhotoIPFS: string,
    bio: string
  ): Promise<boolean> {
    try {
      const accountManager = this.contracts.accountManager;

      // Check if accountManager is defined
      if (!accountManager) {
        console.error("AccountManager contract is not initialized");
        return false;
      }

      const tx = await accountManager.registerUser(
        username,
        profilePhotoIPFS,
        bio
      );
      await tx.wait();
      return true;
    } catch (error) {
      console.error("Error registering user:", error);
      return false;
    }
  }

  async getUserProfile(address: string): Promise<UserProfile | null> {
    try {
      const accountManager = this.contracts.accountManager;

      // Check if accountManager is defined
      if (!accountManager) {
        console.error("AccountManager contract is not initialized");
        return null;
      }

      console.log(">>Trying to fetch user info:", address);
      const profile = await accountManager.getProfileByAddress(address);
      console.log(">>Fetched user info:", profile);
      return {
        username: profile.username,
        profilePhotoIPFS: profile.profilePhotoIPFS,
        bio: profile.bio,
        exists: profile.exists,
        registrationTime:
          typeof profile.registrationTime === "object"
            ? profile.registrationTime.toNumber()
            : Number(profile.registrationTime),
      };
    } catch (error) {
      // console.error("Error fetching user profile:", error);
      return null;
    }
  }

  async updateProfile(profilePhotoIPFS: string, bio: string): Promise<boolean> {
    try {
      const accountManager = this.contracts.accountManager;

      // Check if accountManager is defined
      if (!accountManager) {
        console.error("AccountManager contract is not initialized");
        return false;
      }

      const tx = await accountManager.updateProfile(profilePhotoIPFS, bio);
      await tx.wait();
      return true;
    } catch (error) {
      console.error("Error updating profile:", error);
      return false;
    }
  }

  // Post Manager Methods
  async createPost(contentIPFS: string): Promise<number | null> {
    try {
      const postManager = this.contracts.postManager;
      const tx = await postManager.createPost(contentIPFS);
      const receipt = await tx.wait();

      // Extract postId from event logs
      const event = receipt.events?.find((e: any) => e.event === "PostCreated");
      const postId = event?.args?.postId.toNumber();

      return postId;
    } catch (error) {
      console.error("Error creating post:", error);
      return null;
    }
  }

  async getPost(postId: number): Promise<any> {
    try {
      const postManager = this.contracts.postManager;

      // Check if postManager is defined
      if (!postManager) {
        console.error("PostManager contract is not initialized");
        return null;
      }

      try {
        const post = await postManager.getPostById(postId);
        return {
          author: post.author,
          contentIPFS: post.contentIPFS,
          timestamp:
            typeof post.timestamp === "object"
              ? post.timestamp.toNumber()
              : Number(post.timestamp),
          likesCount:
            typeof post.likesCount === "object"
              ? post.likesCount.toNumber()
              : Number(post.likesCount),
          isDeleted: post.isDeleted,
        };
      } catch (error: any) {
        // Check if the error is because the post is deleted
        if (error.reason === "Post is deleted") {
          // Return a post object that indicates it's deleted
          return {
            author: "0x0000000000000000000000000000000000000000",
            contentIPFS: "",
            timestamp: 0,
            likesCount: 0,
            isDeleted: true,
          };
        }
        // For other errors, log and return null
        console.error(`Error fetching post ${postId}:`, error);
        return null;
      }
    } catch (error) {
      console.error("Error fetching post:", error);
      return null;
    }
  }

  async likePost(postId: number): Promise<boolean> {
    try {
      const postManager = this.contracts.postManager;

      // Check if postManager is defined
      if (!postManager) {
        console.error("PostManager contract is not initialized");
        return false;
      }

      // First check if the user has already liked this post
      if (this.userAddress) {
        try {
          const alreadyLiked = await postManager.hasLiked(
            this.userAddress,
            postId
          );
          if (alreadyLiked) {
            console.error("User has already liked this post");
            throw new Error("You have already liked this post");
          }
        } catch (checkError) {
          console.error("Error checking like status:", checkError);
          // Continue with the like attempt even if check fails
        }
      }

      // Set gas limit explicitly to avoid gas estimation issues
      const tx = await postManager.likePost(postId, {
        gasLimit: 200000, // Explicit gas limit to avoid estimation issues
      });

      await tx.wait();
      return true;
    } catch (error: any) {
      // Parse and format error message for a better user experience
      let errorMessage = "Error liking post";

      if (error.message) {
        if (error.message.includes("Post already liked")) {
          errorMessage = "You have already liked this post";
        } else if (error.message.includes("Post is deleted")) {
          errorMessage = "Cannot like a deleted post";
        } else if (error.message.includes("User is banned")) {
          errorMessage = "You are banned from interacting with the platform";
        } else if (error.message.includes("User is muted")) {
          errorMessage = "You are currently muted and cannot like posts";
        } else if (error.code === -32603) {
          errorMessage =
            "Network error. Please check if your blockchain node is running";
        }
      }

      console.error("Error liking post:", error);
      throw new Error(errorMessage);
    }
  }

  async unlikePost(postId: number): Promise<boolean> {
    try {
      const postManager = this.contracts.postManager;

      // Check if postManager is defined
      if (!postManager) {
        console.error("PostManager contract is not initialized");
        return false;
      }

      // First check if the user has already liked this post
      if (this.userAddress) {
        try {
          const hasLiked = await postManager.hasLiked(this.userAddress, postId);
          if (!hasLiked) {
            console.error("User has not liked this post yet");
            throw new Error("You have not liked this post yet");
          }
        } catch (checkError) {
          console.error("Error checking like status:", checkError);
          // Continue with the unlike attempt even if check fails
        }
      }

      // Set gas limit explicitly to avoid gas estimation issues
      const tx = await postManager.unlikePost(postId, {
        gasLimit: 200000, // Explicit gas limit to avoid estimation issues
      });

      await tx.wait();
      return true;
    } catch (error: any) {
      // Parse and format error message for a better user experience
      let errorMessage = "Error unliking post";

      if (error.message) {
        if (error.message.includes("Post not liked yet")) {
          errorMessage = "You have not liked this post yet";
        } else if (error.message.includes("Post is deleted")) {
          errorMessage = "Cannot unlike a deleted post";
        } else if (error.message.includes("User is banned")) {
          errorMessage = "You are banned from interacting with the platform";
        } else if (error.message.includes("User is muted")) {
          errorMessage = "You are currently muted and cannot unlike posts";
        } else if (error.code === -32603) {
          errorMessage =
            "Network error. Please check if your blockchain node is running";
        }
      }

      console.error("Error unliking post:", error);
      throw new Error(errorMessage);
    }
  }

  async getUserPosts(address: string): Promise<number[]> {
    try {
      const postManager = this.contracts.postManager;

      // Check if postManager is defined
      if (!postManager) {
        console.error("PostManager contract is not initialized");
        return [];
      }

      const posts = await postManager.getPostsByUser(address);
      return posts.map((id: any) => id.toNumber());
    } catch (error) {
      console.error("Error fetching user posts:", error);
      return [];
    }
  }

  async deletePost(postId: number): Promise<boolean> {
    try {
      const postManager = this.contracts.postManager;
      const tx = await postManager.deletePost(postId);
      await tx.wait();
      return true;
    } catch (error) {
      console.error("Error deleting post:", error);
      return false;
    }
  }

  // Comment Manager Methods
  async getPostComments(postId: number): Promise<number[]> {
    try {
      const commentManager = this.contracts.commentManager;

      // Check if commentManager is defined
      if (!commentManager) {
        console.error("CommentManager contract is not initialized");
        return [];
      }

      // Validate postId
      if (postId === undefined || postId === null) {
        console.error("Invalid postId:", postId);
        return [];
      }

      try {
        const result = await commentManager.getCommentsByPostId(postId, 0, 100);
        // Return the comment IDs from the result
        return result && result.commentIds
          ? result.commentIds.map((id: any) => id.toNumber())
          : [];
      } catch (error) {
        console.error(`Error fetching comments for post ${postId}:`, error);
        // If this post doesn't have any comments yet, return an empty array
        return [];
      }
    } catch (error) {
      console.error("Error fetching post comments:", error);
      return [];
    }
  }

  async getComment(commentId: number): Promise<any> {
    try {
      const commentManager = this.contracts.commentManager;

      // Check if commentManager is defined
      if (!commentManager) {
        console.error("CommentManager contract is not initialized");
        return null;
      }

      // Validate commentId
      if (commentId === undefined || commentId === null) {
        console.error("Invalid commentId:", commentId);
        return null;
      }

      try {
        const comment = await commentManager.getCommentById(commentId);

        // Check if comment exists and has required fields
        if (!comment || !comment.author) {
          console.error("Comment data incomplete:", comment);
          return null;
        }

        return {
          postId:
            typeof comment.postId === "object"
              ? comment.postId.toNumber()
              : Number(comment.postId),
          author:
            comment.author || "0x0000000000000000000000000000000000000000",
          content: comment.content || "",
          timestamp:
            typeof comment.timestamp === "object"
              ? comment.timestamp.toNumber()
              : Number(comment.timestamp),
          likesCount:
            typeof comment.likesCount === "object"
              ? comment.likesCount.toNumber()
              : Number(comment.likesCount),
          isDeleted: comment.isDeleted || false,
        };
      } catch (error) {
        console.error(`Error fetching comment ${commentId}:`, error);
        return null;
      }
    } catch (error) {
      console.error(`Error fetching comment ${commentId}:`, error);
      return null;
    }
  }

  async createComment(postId: number, content: string): Promise<number | null> {
    try {
      const commentManager = this.contracts.commentManager;

      // Check if commentManager is defined
      if (!commentManager) {
        console.error("CommentManager contract is not initialized");
        return null;
      }

      // Validate inputs
      if (postId === undefined || postId === null) {
        console.error("Invalid postId for comment:", postId);
        throw new Error("Invalid post ID");
      }

      if (!content || content.trim() === "") {
        console.error("Empty comment content");
        throw new Error("Comment content cannot be empty");
      }

      // Set explicit gas limit to avoid estimation issues
      const tx = await commentManager.createComment(postId, content, {
        gasLimit: 300000, // Comments may need more gas than likes
      });

      const receipt = await tx.wait();

      // Extract commentId from event logs
      try {
        const event = receipt.events?.find(
          (e: any) => e.event === "CommentCreated"
        );
        if (!event || !event.args) {
          console.error("Comment created but event not found in receipt");
          return null;
        }

        // CommentCreated event has commentId as the first indexed parameter
        const commentId = event.args[0];
        return commentId
          ? typeof commentId.toNumber === "function"
            ? commentId.toNumber()
            : Number(commentId)
          : null;
      } catch (eventError) {
        console.error("Error parsing comment event:", eventError);
        return null;
      }
    } catch (error: any) {
      // Parse error for a better message
      let errorMessage = "Error creating comment";

      if (error.message) {
        if (error.message.includes("User is banned")) {
          errorMessage = "You are banned from commenting";
        } else if (error.message.includes("User is muted")) {
          errorMessage = "You are currently muted and cannot comment";
        } else if (error.message.includes("Post is deleted")) {
          errorMessage = "Cannot comment on a deleted post";
        } else if (error.code === -32603) {
          errorMessage =
            "Network error. Please check if your blockchain node is running";
        }
      }

      console.error("Error creating comment:", error);
      throw new Error(errorMessage);
    }
  }

  async likeComment(commentId: number): Promise<boolean> {
    try {
      const commentManager = this.contracts.commentManager;
      const tx = await commentManager.likeComment(commentId);
      await tx.wait();
      return true;
    } catch (error) {
      console.error("Error liking comment:", error);
      return false;
    }
  }

  async unlikeComment(commentId: number): Promise<boolean> {
    try {
      const commentManager = this.contracts.commentManager;
      const tx = await commentManager.unlikeComment(commentId);
      await tx.wait();
      return true;
    } catch (error) {
      console.error("Error unliking comment:", error);
      return false;
    }
  }

  async deleteComment(commentId: number): Promise<boolean> {
    try {
      const commentManager = this.contracts.commentManager;
      const tx = await commentManager.deleteComment(commentId);
      await tx.wait();
      return true;
    } catch (error) {
      console.error("Error deleting comment:", error);
      return false;
    }
  }

  // Follow Manager Methods
  async followUser(userToFollow: string): Promise<boolean> {
    try {
      const followManager = this.contracts.followManager;
      if (!followManager) return false;

      const tx = await followManager.follow(userToFollow);
      await tx.wait();
      return true;
    } catch (error) {
      console.error("Error following user:", error);
      return false;
    }
  }

  async unfollowUser(userToUnfollow: string): Promise<boolean> {
    try {
      const followManager = this.contracts.followManager;
      if (!followManager) return false;

      const tx = await followManager.unfollow(userToUnfollow);
      await tx.wait();
      return true;
    } catch (error) {
      console.error("Error unfollowing user:", error);
      return false;
    }
  }

  async getFollowers(user: string): Promise<string[]> {
    try {
      const followManager = this.contracts.followManager;
      if (!followManager) return [];

      // Use pagination to get first 50 followers
      const followers = await followManager.getFollowers(user, 0, 50);
      return followers || [];
    } catch (error) {
      console.error("Error fetching followers:", error);
      return [];
    }
  }

  async getFollowing(user: string): Promise<string[]> {
    try {
      const followManager = this.contracts.followManager;
      if (!followManager) return [];

      // Use pagination to get first 50 following
      const following = await followManager.getFollowing(user, 0, 50);
      return following || [];
    } catch (error) {
      console.error("Error fetching following:", error);
      return [];
    }
  }

  async isFollowing(follower: string, followed: string): Promise<boolean> {
    try {
      const followManager = this.contracts.followManager;
      if (!followManager) return false;

      return await followManager.checkFollowing(follower, followed);
    } catch (error) {
      console.error("Error checking following status:", error);
      return false;
    }
  }

  // Moderation Manager Methods
  async addModerator(moderator: string): Promise<boolean> {
    try {
      const moderationManager = this.contracts.moderationManager;
      const tx = await moderationManager.addModerator(moderator);
      await tx.wait();
      return true;
    } catch (error) {
      console.error("Error adding moderator:", error);
      return false;
    }
  }

  async removeModerator(moderator: string): Promise<boolean> {
    try {
      const moderationManager = this.contracts.moderationManager;
      const tx = await moderationManager.removeModerator(moderator);
      await tx.wait();
      return true;
    } catch (error) {
      console.error("Error removing moderator:", error);
      return false;
    }
  }

  async banUser(user: string, reason: string): Promise<boolean> {
    try {
      const moderationManager = this.contracts.moderationManager;
      const tx = await moderationManager.banUser(user, reason);
      await tx.wait();
      return true;
    } catch (error) {
      console.error("Error banning user:", error);
      return false;
    }
  }

  async unbanUser(user: string): Promise<boolean> {
    try {
      const moderationManager = this.contracts.moderationManager;
      const tx = await moderationManager.unbanUser(user);
      await tx.wait();
      return true;
    } catch (error) {
      console.error("Error unbanning user:", error);
      return false;
    }
  }

  async muteUser(
    user: string,
    reason: string,
    duration: number
  ): Promise<boolean> {
    try {
      const moderationManager = this.contracts.moderationManager;
      const tx = await moderationManager.muteUser(user, reason, duration);
      await tx.wait();
      return true;
    } catch (error) {
      console.error("Error muting user:", error);
      return false;
    }
  }

  async unmuteUser(user: string): Promise<boolean> {
    try {
      const moderationManager = this.contracts.moderationManager;
      const tx = await moderationManager.unmuteUser(user);
      await tx.wait();
      return true;
    } catch (error) {
      console.error("Error unmuting user:", error);
      return false;
    }
  }

  async removePost(postId: number, reason: string): Promise<boolean> {
    try {
      const moderationManager = this.contracts.moderationManager;
      const tx = await moderationManager.removePost(postId, reason);
      await tx.wait();
      return true;
    } catch (error) {
      console.error("Error removing post:", error);
      return false;
    }
  }

  async removeComment(commentId: number, reason: string): Promise<boolean> {
    try {
      const moderationManager = this.contracts.moderationManager;
      const tx = await moderationManager.removeComment(commentId, reason);
      await tx.wait();
      return true;
    } catch (error) {
      console.error("Error removing comment:", error);
      return false;
    }
  }

  async isModerator(user: string): Promise<boolean> {
    try {
      const moderationManager = this.contracts.moderationManager;
      if (!moderationManager) return false;

      return await moderationManager.isModerator(user);
    } catch (error) {
      console.error("Error checking moderator status:", error);
      return false;
    }
  }

  async isUserBanned(user: string): Promise<boolean> {
    try {
      const moderationManager = this.contracts.moderationManager;
      return await moderationManager.isUserBanned(user);
    } catch (error) {
      console.error("Error checking ban status:", error);
      return false;
    }
  }

  async isUserMuted(user: string): Promise<boolean> {
    try {
      const moderationManager = this.contracts.moderationManager;
      return await moderationManager.isUserMuted(user);
    } catch (error) {
      console.error("Error checking mute status:", error);
      return false;
    }
  }
  // Token Manager Methods
  async getBalance(address: string): Promise<string> {
    try {
      const socialToken = this.contracts.socialToken;
      if (!socialToken) {
        console.error("SocialToken contract is not initialized");
        return "0";
      }
      const balance = await socialToken.balanceOf(address);
      return ethers.formatUnits(balance, 18); // Assuming 18 decimals
    } catch (error) {
      console.error("Error fetching token balance:", error);
      return "0";
    }
  }
  async transfer(to: string, amount: string): Promise<boolean> {
    try {
      const socialToken = this.contracts.socialToken;
      if (!socialToken) {
        console.error("SocialToken contract is not initialized");
        return false;
      }
      const parsedAmount = ethers.parseUnits(amount, 18); // Assuming 18 decimals
      const tx = await socialToken.transfer(to, parsedAmount);
      await tx.wait();
      return true;
    } catch (error) {
      console.error("Error transferring tokens:", error);
      return false;
    }
  }

  async getTotalSupply(): Promise<string> {
    try {
      const socialToken = this.contracts.socialToken;
      const supply = await socialToken.totalSupply();
      return ethers.formatUnits(supply, 18); // Assuming 18 decimals
    } catch (error) {
      console.error("Error fetching total supply:", error);
      return "0";
    }
  }

  // NFT Methods
  async mintPostNFT(postId: number): Promise<boolean> {
    try {
      const postNFT = this.contracts.postNFT;
      const tx = await postNFT.mint(postId);
      await tx.wait();
      return true;
    } catch (error) {
      console.error("Error minting NFT:", error);
      return false;
    }
  }

  async listNFTForSale(tokenId: number, price: string): Promise<boolean> {
    try {
      const postMarketplace = this.contracts.postMarketplace;
      const parsedPrice = ethers.parseUnits(price, 18); // Assuming 18 decimals
      const tx = await postMarketplace.listForSale(tokenId, parsedPrice);
      await tx.wait();
      return true;
    } catch (error) {
      console.error("Error listing NFT for sale:", error);
      return false;
    }
  }

  async buyNFT(tokenId: number): Promise<boolean> {
    try {
      const postMarketplace = this.contracts.postMarketplace;
      const listing = await postMarketplace.getListing(tokenId);
      const tx = await postMarketplace.buyNFT(tokenId, {
        value: listing.price,
      });
      await tx.wait();
      return true;
    } catch (error) {
      console.error("Error buying NFT:", error);
      return false;
    }
  }

  async cancelListing(tokenId: number): Promise<boolean> {
    try {
      const postMarketplace = this.contracts.postMarketplace;
      const tx = await postMarketplace.cancelListing(tokenId);
      await tx.wait();
      return true;
    } catch (error) {
      console.error("Error canceling NFT listing:", error);
      return false;
    }
  }

  async getOwnedNFTs(): Promise<number[]> {
    try {
      const postNFT = this.contracts.postNFT;
      if (!this.userAddress) return [];

      const balance = await postNFT.balanceOf(this.userAddress);
      const ownedNFTs = [];

      for (let i = 0; i < balance.toNumber(); i++) {
        const tokenId = await postNFT.tokenOfOwnerByIndex(this.userAddress, i);
        ownedNFTs.push(tokenId.toNumber());
      }

      return ownedNFTs;
    } catch (error) {
      console.error("Error fetching owned NFTs:", error);
      return [];
    }
  }

  async hasLikedPost(userAddress: string, postId: number): Promise<boolean> {
    try {
      const postManager = this.contracts.postManager;
      return await postManager.hasLiked(userAddress, postId);
    } catch (error) {
      console.error("Error checking if post is liked:", error);
      return false;
    }
  }

  async hasLikedComment(
    userAddress: string,
    commentId: number
  ): Promise<boolean> {
    try {
      const commentManager = this.contracts.commentManager;
      return await commentManager.hasLikedComment(userAddress, commentId);
    } catch (error) {
      console.error("Error checking if comment is liked:", error);
      return false;
    }
  }

  // Get recent posts with pagination
  async getRecentPosts(
    offset: number,
    limit: number
  ): Promise<{ posts: any[]; postIds: number[] }> {
    try {
      const postManager = this.contracts.postManager;

      // Check if postManager is defined
      if (!postManager) {
        console.error("PostManager contract is not initialized");
        return { posts: [], postIds: [] };
      }

      // Call the contract's getRecentPosts function using safeContractCall to handle block tag errors
      const result = await this.safeContractCall(
        postManager.getRecentPosts.bind(postManager),
        offset,
        limit,
        { blockTag: "latest" } // Explicitly use latest block to avoid invalid block tag errors
      );

      if (!result || !result.posts_ || !result.postIds) {
        return { posts: [], postIds: [] };
      }

      // Format the returned posts
      const posts = result.posts_.map((post: any) => ({
        author: post.author,
        contentIPFS: post.contentIPFS,
        timestamp:
          typeof post.timestamp === "object"
            ? post.timestamp.toNumber()
            : Number(post.timestamp),
        likesCount:
          typeof post.likesCount === "object"
            ? post.likesCount.toNumber()
            : Number(post.likesCount),
        isDeleted: post.isDeleted,
      }));

      // Format the returned post IDs
      const postIds = result.postIds.map((id: any) =>
        typeof id.toNumber === "function" ? id.toNumber() : Number(id)
      );

      return { posts, postIds };
    } catch (error) {
      console.error("Error fetching recent posts:", error);
      return { posts: [], postIds: [] };
    }
  }

  // Get total post count
  async getPostCount(): Promise<number> {
    try {
      const postManager = this.contracts.postManager;

      if (!postManager) {
        console.error("PostManager contract is not initialized");
        return 0;
      }

      const count = await postManager.getPostCount();
      return typeof count.toNumber === "function"
        ? count.toNumber()
        : Number(count);
    } catch (error) {
      console.error("Error fetching post count:", error);
      return 0;
    }
  }
}

// Create a singleton instance
const blockchainService = new BlockchainService();
export default blockchainService;
