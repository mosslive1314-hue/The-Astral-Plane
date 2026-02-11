-- 创建exec_sql RPC函数
-- 这是自动迁移的前提条件，必须先在Supabase SQL Editor中执行此脚本

CREATE OR REPLACE FUNCTION exec_sql(sql_param TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    EXECUTE sql_param;
    
    result := json_build_object(
        'success', true,
        'message', 'SQL执行成功'
    );
    
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        result := json_build_object(
            'success', false,
            'message', SQLERRM
        );
        RETURN result;
END;
$$;

-- 授权执行权限
GRANT EXECUTE ON FUNCTION exec_sql TO postgres;
GRANT EXECUTE ON FUNCTION exec_sql TO anon;
GRANT EXECUTE ON FUNCTION exec_sql TO authenticated;
GRANT EXECUTE ON FUNCTION exec_sql TO service_role;
