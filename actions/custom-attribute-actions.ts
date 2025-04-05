// Added 2024-04-04: Server actions for consolidated custom attributes.
"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import {
  createCustomAttribute,
  deleteCustomAttribute,
  getCustomAttributeById,
  updateCustomAttribute,
  getCustomAttributes
} from "@/db/queries/custom-attributes-queries"; // Use new generic queries
import { attributeTypeEnum, type SelectCustomAttribute } from "@/db/schema"; // Use new schema types/enum
import { z } from "zod";

// Define Zod schema for validating attribute type
const AttributeTypeSchema = z.enum(attributeTypeEnum.enumValues);

// Define Zod schema for creating a new attribute
// Requires name and type, description is optional
const CreateAttributeSchema = z.object({
  name: z.string().min(1, "Name cannot be empty"),
  description: z.string().optional(), // Expects string or undefined
  attribute_type: AttributeTypeSchema, // Use the enum schema
});

// Define Zod schema for updating an attribute
// Requires ID and name, description is optional
const UpdateAttributeSchema = z.object({
  id: z.string().uuid("Invalid ID format"), // Assuming UUIDs are used, adjust if text
  name: z.string().min(1, "Name cannot be empty"),
  description: z.string().nullish(), // Allow null or undefined
});

// Define Zod schema for deleting an attribute
// Requires only the ID
const DeleteAttributeSchema = z.object({
  id: z.string().uuid("Invalid ID format"), // Assuming UUIDs are used, adjust if text
});

// Common ActionResult type for returning structured responses from actions
type ActionResult<T> = {
  isSuccess: boolean;
  data?: T;
  error?: string;
  validationErrors?: Record<string, string[]>; // For detailed validation feedback
};

/**
 * Action to get custom attributes for the logged-in user based on type.
 * @param type - The type of attribute ('brand', 'franchise', 'type').
 * @returns ActionResult containing the list of attributes or an error.
 */
export async function getCustomAttributesAction(
  type: z.infer<typeof AttributeTypeSchema> // Use Zod type for validation
): Promise<ActionResult<SelectCustomAttribute[]>> {
  try {
    // Validate the input type
    const typeValidation = AttributeTypeSchema.safeParse(type);
    if (!typeValidation.success) {
      return { isSuccess: false, error: "Invalid attribute type provided." };
    }
    const validatedType = typeValidation.data;

    // Check user authentication
    const { userId } = auth();
    if (!userId) {
      return { isSuccess: false, error: "Unauthorized: User not logged in." };
    }

    // Fetch attributes using the generic query
    const attributes = await getCustomAttributes(userId, validatedType);
    return { isSuccess: true, data: attributes };
  } catch (error) {
    console.error(`Failed to get custom attributes of type ${type}:`, error);
    return { isSuccess: false, error: `Failed to get custom ${type}s` };
  }
}

/**
 * Action to create a new custom attribute from FormData.
 * @param formData - The FormData object from the form submission.
 * @returns ActionResult indicating success or failure (with validation errors).
 */
export async function createCustomAttributeAction(
  formData: FormData
): Promise<ActionResult<SelectCustomAttribute>> {
  try {
    // Check user authentication
    const { userId } = auth();
    if (!userId) {
      return { isSuccess: false, error: "Unauthorized: User not logged in." };
    }

    // Extract data from FormData
    const name = formData.get("name") as string;
    // Get description, explicitly handle null case for Zod
    const descriptionValue = formData.get("description");
    const description = descriptionValue === null ? undefined : descriptionValue as string;
    const attribute_type = formData.get("attribute_type") as string;

    // Validate extracted data using Zod schema
    const validationResult = CreateAttributeSchema.safeParse({ 
      name, 
      description, // Pass the potentially undefined description 
      attribute_type 
    });

    if (!validationResult.success) {
      // Log detailed validation errors
      console.error('❌ Create Attribute Validation failed:', validationResult.error.formErrors);
      return {
        isSuccess: false,
        error: "Invalid input data",
        validationErrors: validationResult.error.formErrors.fieldErrors // Return field-specific errors
      };
    }

    const validatedData = validationResult.data;

    // Create the attribute using the generic query
    const newAttribute = await createCustomAttribute({
      userId,
      name: validatedData.name,
      description: validatedData.description, // Pass validated description (string|undefined)
      attribute_type: validatedData.attribute_type,
    });

    // Revalidate relevant paths to update UI caches
    // Revalidate settings and potentially other areas where these attributes are used
    revalidatePath("/settings");
    // Consider revalidating other paths like '/my-collection' if dropdowns there need immediate updates
    // revalidatePath("/my-collection");

    return { isSuccess: true, data: newAttribute };
  } catch (error) {
    console.error("Failed to create custom attribute:", error);
    return { isSuccess: false, error: "Failed to create custom attribute" };
  }
}

/**
 * Action to update an existing custom attribute from FormData.
 * @param formData - The FormData object from the form submission.
 * @returns ActionResult indicating success or failure (with validation errors).
 */
export async function updateCustomAttributeAction(
  formData: FormData
): Promise<ActionResult<SelectCustomAttribute>> {
  try {
    // Check user authentication
    const { userId } = auth();
    if (!userId) {
      return { isSuccess: false, error: "Unauthorized: User not logged in." };
    }

    // Extract data from FormData
    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const description = formData.get("description") as string | null;

    // Validate extracted data using Zod schema
    const validationResult = UpdateAttributeSchema.safeParse({ id, name, description });

    if (!validationResult.success) {
      // Log detailed validation errors
      console.error('❌ Update Attribute Validation failed:', validationResult.error.formErrors);
      return {
        isSuccess: false,
        error: "Invalid input data",
        validationErrors: validationResult.error.formErrors.fieldErrors // Return field-specific errors
      };
    }

    const validatedData = validationResult.data;

    // --- Authorization Check ---
    // Fetch the existing attribute to check ownership
    const existingAttribute = await getCustomAttributeById(validatedData.id);
    if (!existingAttribute) {
      return { isSuccess: false, error: "Attribute not found." };
    }
    // Ensure the logged-in user owns this attribute
    if (existingAttribute.userId !== userId) {
      return { isSuccess: false, error: "Unauthorized: You do not own this attribute." };
    }
    // --- End Authorization Check ---

    // Update the attribute using the generic query
    const updatedAttribute = await updateCustomAttribute(validatedData.id, {
      name: validatedData.name,
      description: validatedData.description, // Zod schema for update uses nullish, db query handles null
    });

    if (!updatedAttribute) {
       return { isSuccess: false, error: "Failed to update attribute (not found after update)." };
    }

    // Revalidate relevant paths
    revalidatePath("/settings");
    // revalidatePath("/my-collection"); // If necessary

    return { isSuccess: true, data: updatedAttribute };
  } catch (error) {
    console.error("Failed to update custom attribute:", error);
    return { isSuccess: false, error: "Failed to update custom attribute" };
  }
}

/**
 * Action to delete a custom attribute from FormData.
 * @param formData - The FormData object from the form submission (should contain the 'id').
 * @returns ActionResult indicating success or failure.
 */
export async function deleteCustomAttributeAction(
  formData: FormData
): Promise<ActionResult<void>> {
  try {
    // Check user authentication
    const { userId } = auth();
    if (!userId) {
      return { isSuccess: false, error: "Unauthorized: User not logged in." };
    }

    // Extract ID from FormData
    const id = formData.get("id") as string;

    // Validate extracted ID using Zod schema
    const validationResult = DeleteAttributeSchema.safeParse({ id });

    if (!validationResult.success) {
      // Log detailed validation errors
      console.error('❌ Delete Attribute Validation failed:', validationResult.error.formErrors);
      return {
        isSuccess: false,
        error: "Invalid input data",
        validationErrors: validationResult.error.formErrors.fieldErrors // Return field-specific errors
      };
    }

    const validatedData = validationResult.data;

    // --- Authorization Check ---
    // Fetch the existing attribute to check ownership
    const existingAttribute = await getCustomAttributeById(validatedData.id);
    if (!existingAttribute) {
      // If it doesn't exist, maybe it was already deleted? Return success.
      console.log(`Attribute ${validatedData.id} not found for deletion (maybe already deleted).`);
      return { isSuccess: true };
      // Or return error: return { isSuccess: false, error: "Attribute not found." };
    }
    // Ensure the logged-in user owns this attribute
    if (existingAttribute.userId !== userId) {
      return { isSuccess: false, error: "Unauthorized: You do not own this attribute." };
    }
    // --- End Authorization Check ---

    // Delete the attribute using the generic query
    await deleteCustomAttribute(validatedData.id);

    // Revalidate relevant paths
    revalidatePath("/settings");
    // revalidatePath("/my-collection"); // If necessary

    return { isSuccess: true };
  } catch (error) {
    console.error("Failed to delete custom attribute:", error);
    return { isSuccess: false, error: "Failed to delete custom attribute" };
  }
}
