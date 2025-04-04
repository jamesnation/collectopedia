-- Migration to add 'admin' role to membership enum
-- Created: 2023-11-09

-- Add the 'admin' value to the membership enum
ALTER TYPE "public"."membership" ADD VALUE 'admin'; 