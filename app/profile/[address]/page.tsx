"use client";

import { useParams } from "next/navigation";
import ProfilePage from "@/components/profile-page";

export default function UserProfile() {
  const params = useParams();
  const userAddress = params.address as string;

  return <ProfilePage userAddress={userAddress} />;
}
