-- Migration to add 'admin' role to membership enum
-- Created: 2023-11-09

ALTER TYPE "public"."membership" ADD VALUE 'admin'; 