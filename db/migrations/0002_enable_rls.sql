-- Enable RLS on all tables
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_brands ENABLE ROW LEVEL SECURITY;

-- Items table policies
CREATE POLICY "Users can view their own items" ON public.items
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create their own items" ON public.items
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own items" ON public.items
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own items" ON public.items
    FOR DELETE USING (auth.uid()::text = user_id);

-- Profiles table policies
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid()::text = user_id);

-- Images table policies
CREATE POLICY "Users can view their own images" ON public.images
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create their own images" ON public.images
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own images" ON public.images
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own images" ON public.images
    FOR DELETE USING (auth.uid()::text = user_id);

-- Custom types table policies
CREATE POLICY "Users can view their own custom types" ON public.custom_types
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create their own custom types" ON public.custom_types
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own custom types" ON public.custom_types
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own custom types" ON public.custom_types
    FOR DELETE USING (auth.uid()::text = user_id);

-- Custom brands table policies
CREATE POLICY "Users can view their own custom brands" ON public.custom_brands
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create their own custom brands" ON public.custom_brands
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own custom brands" ON public.custom_brands
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own custom brands" ON public.custom_brands
    FOR DELETE USING (auth.uid()::text = user_id); 