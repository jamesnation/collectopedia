"use server";

import { createProfile, deleteProfile, getAllProfiles, getProfileByUserId, updateProfile } from "@/db/queries/profiles-queries";
import { InsertProfile, SelectProfile } from "@/db/schema/profiles-schema";
import { ActionResult } from "@/types/actions/actions-types";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";

export async function createProfileAction(data: Omit<InsertProfile, 'userId'>): Promise<ActionResult<SelectProfile>> {
  try {
    const { userId } = auth();
    if (!userId) {
      throw new Error("Authentication Required: User not logged in.");
    }
    
    const profileData = {
      ...data,
      userId,
    };
    
    const newProfile = await createProfile(profileData);
    revalidatePath("/");
    return { isSuccess: true, message: "Profile created successfully", data: newProfile };
  } catch (error) {
    return { isSuccess: false, message: "Failed to create profile" };
  }
}

export async function getCurrentUserProfileAction(): Promise<ActionResult<SelectProfile | null>> {
  try {
    const { userId } = auth();
    if (!userId) {
      throw new Error("Authentication Required: User not logged in.");
    }
    
    const profile = await getProfileByUserId(userId);
    return { isSuccess: true, message: "Profile retrieved successfully", data: profile };
  } catch (error) {
    return { isSuccess: false, message: "Failed to get profile" };
  }
}

export async function getProfileByUserIdAction(userId: string): Promise<ActionResult<SelectProfile | null>> {
  console.warn("DEPRECATED: Please use getCurrentUserProfileAction instead of getProfileByUserIdAction");
  
  const { userId: authenticatedUserId } = auth();
  if (!authenticatedUserId) {
    throw new Error("Authentication Required: User not logged in.");
  }
  
  if (userId !== authenticatedUserId) {
    throw new Error("Authorization Failed: You can only access your own profile.");
  }
  
  return getCurrentUserProfileAction();
}

export async function getAllProfilesAction(): Promise<ActionResult<SelectProfile[]>> {
  try {
    const { userId } = auth();
    if (!userId) {
      throw new Error("Authentication Required: User not logged in.");
    }
    
    const profiles = await getAllProfiles();
    return { isSuccess: true, message: "Profiles retrieved successfully", data: profiles };
  } catch (error) {
    return { isSuccess: false, message: "Failed to get profiles" };
  }
}

export async function updateProfileAction(data: Partial<Omit<InsertProfile, 'userId'>>): Promise<ActionResult<SelectProfile>> {
  try {
    const { userId } = auth();
    if (!userId) {
      throw new Error("Authentication Required: User not logged in.");
    }
    
    const updatedProfile = await updateProfile(userId, data);
    revalidatePath("/");
    return { isSuccess: true, message: "Profile updated successfully", data: updatedProfile };
  } catch (error) {
    return { isSuccess: false, message: "Failed to update profile" };
  }
}

export async function deleteProfileAction(): Promise<ActionResult<void>> {
  try {
    const { userId } = auth();
    if (!userId) {
      throw new Error("Authentication Required: User not logged in.");
    }
    
    await deleteProfile(userId);
    revalidatePath("/");
    return { isSuccess: true, message: "Profile deleted successfully" };
  } catch (error) {
    return { isSuccess: false, message: "Failed to delete profile" };
  }
}
