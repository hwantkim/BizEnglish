import { connectToDatabase } from '@/db';
import sql from 'mssql';

export const runtime = 'nodejs';

// 1. 로그인 또는 회원가입 처리
export async function POST(request) {
  try {
    const { email, name } = await request.json();

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const pool = await connectToDatabase();

    // 이메일로 사용자 조회
    let userResult = await pool.request()
      .input('Email', sql.NVarChar, email.trim().toLowerCase())
      .query('SELECT * FROM Users WHERE Email = @Email');

    let user = userResult.recordset[0];

    // 존재하지 않는 사용자라면 신규 가입 처리
    if (!user) {
      if (!name) {
        return new Response(JSON.stringify({ error: 'Name is required for registration' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const insertResult = await pool.request()
        .input('Email', sql.NVarChar, email.trim().toLowerCase())
        .input('Name', sql.NVarChar, name.trim())
        .query(`
          INSERT INTO Users (Email, Name)
          OUTPUT inserted.*
          VALUES (@Email, @Name)
        `);
      user = insertResult.recordset[0];
    }

    // 로그인 처리를 위해 biz_user_id 쿠키 셋팅용 헤더 구성
    const responseBody = JSON.stringify(user);
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    
    // 심플한 보안 수준의 쿠키 발행 (Path=/ 전체 적용, 만료 기한 30일 설정)
    headers.set('Set-Cookie', `biz_user_id=${user.UserID}; Path=/; Max-Age=2592000; SameSite=Lax`);

    return new Response(responseBody, {
      status: 200,
      headers
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
