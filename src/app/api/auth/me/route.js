import { connectToDatabase } from '@/db';
import sql from 'mssql';

export const runtime = 'nodejs';

// 요청 헤더에서 biz_user_id 쿠키를 추출해내는 헬퍼 함수
export function getUserIdFromRequest(request) {
  const cookieHeader = request.headers.get('cookie') || '';
  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    if (key) acc[key] = value;
    return acc;
  }, {});
  return cookies.biz_user_id ? parseInt(cookies.biz_user_id) : null;
}

// 현재 쿠키의 UserID에 연동된 사용자명 가져오기
export async function GET(request) {
  try {
    const userId = getUserIdFromRequest(request);

    if (!userId) {
      return new Response(JSON.stringify({ user: null }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const pool = await connectToDatabase();
    const result = await pool.request()
      .input('UserID', sql.Int, userId)
      .query('SELECT UserID, Email, Name FROM Users WHERE UserID = @UserID');

    const user = result.recordset[0];

    return new Response(JSON.stringify({ user: user || null }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
