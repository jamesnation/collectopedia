-- Check RLS status for tables
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('items', 'profiles', 'images', 'custom_types', 'custom_brands');

-- Check policies for each table
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd AS operation,
    roles,
    qual AS using_expression,
    with_check AS with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('items', 'profiles', 'images', 'custom_types', 'custom_brands')
ORDER BY tablename, cmd; 