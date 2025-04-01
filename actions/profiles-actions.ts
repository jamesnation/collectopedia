"use server";

import { createProfile, deleteProfile, getAllProfiles, getProfileByUserId, updateProfile } from "@/db/queries/profiles-queries";
import { InsertProfile, SelectProfile } from "@/db/schema/profiles-schema";
import { ActionResult } from "@/types/actions/actions-types";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { CreateProfileSchema, UpdateProfileSchema } from "@/lib/schemas/profile-schemas";

type ValidatedActionResult<T> = ActionResult<T> & {
  validationErrors?: Record<string, string[]>;
};

export async function createProfileAction(data: unknown): Promise<ValidatedActionResult<SelectProfile>> {
  try {
    const { userId } = auth();
    if (!userId) {
      throw new Error("Authentication Required: User not logged in.");
    }
    
    const validationResult = CreateProfileSchema.safeParse(data);
    
    if (!validationResult.success) {
      console.error('❌ Validation failed:', validationResult.error);
      return { 
        isSuccess: false, 
        message: "Invalid input data", 
        validationErrors: validationResult.error.formErrors.fieldErrors
      };
    }
    
    const validatedData = validationResult.data;
    
    const profileData = {
      ...validatedData,
      userId,
    };
    
    const newProfile = await createProfile(profileData);
    revalidatePath("/");
    return { isSuccess: true, message: "Profile created successfully", data: newProfile };
  } catch (error) {
    return { isSuccess: false, message: "Failed to create profile" };
  }
}

export async function getCurrentUserProfileAction(): Promise<ValidatedActionResult<SelectProfile | null>> {
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

export async function getProfileByUserIdAction(userId: string): Promise<ValidatedActionResult<SelectProfile | null>> {
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

export async function getAllProfilesAction(): Promise<ValidatedActionResult<SelectProfile[]>> {
  try {
    const session = auth();
    
    if (!session || !session.userId) {
      throw new Error("Authentication Required: User not logged in.");
    }
    
    // Check for admin role in session claims
    const metadata = session.sessionClaims?.metadata as { role?: string } || {};
    const isAdmin = metadata.role === 'admin';
    
    if (!isAdmin) {
      return { 
        isSuccess: false, 
        message: "Authorization Failed: Only administrators can access all user profiles." 
      };
    }
    
    const profiles = await getAllProfiles();
    return { isSuccess: true, message: "Profiles retrieved successfully", data: profiles };
  } catch (error) {
    return { isSuccess: false, message: "Failed to get profiles" };
  }
}

export async function updateProfileAction(data: unknown): Promise<ValidatedActionResult<SelectProfile>> {
  try {
    const { userId } = auth();
    if (!userId) {
      throw new Error("Authentication Required: User not logged in.");
    }
    
    const validationResult = UpdateProfileSchema.safeParse(data);
    
    if (!validationResult.success) {
      console.error('❌ Validation failed:', validationResult.error);
      return { 
        isSuccess: false, 
        message: "Invalid input data", 
        validationErrors: validationResult.error.formErrors.fieldErrors
      };
    }
    
    const validatedData = validationResult.data;
    
    const updatedProfile = await updateProfile(userId, validatedData);
    revalidatePath("/");
    return { isSuccess: true, message: "Profile updated successfully", data: updatedProfile };
  } catch (error) {
    return { isSuccess: false, message: "Failed to update profile" };
  }
}

export async function deleteProfileAction(): Promise<ValidatedActionResult<void>> {
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
