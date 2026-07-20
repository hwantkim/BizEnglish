import { connectToDatabase } from '@/db';
import sql from 'mssql';
import { getUserIdFromRequest } from '../auth/me/route';

// 메모 추가 API
export async function POST(request) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return new Response(JSON.stringify({ error: '인증되지 않은 사용자입니다. 로그인이 필요합니다.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { chapterId, scriptId, content } = await request.json();
    
    if (!chapterId || !content) {
      return new Response(JSON.stringify({ error: 'chapterId and content are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const pool = await connectToDatabase();
    
    const result = await pool.request()
      .input('ChapterID', sql.Int, chapterId)
      .input('ScriptID', sql.Int, scriptId || null)
      .input('Content', sql.NVarChar, content)
      .input('UserID', sql.Int, userId)
      .query(`
        INSERT INTO Notes (ChapterID, ScriptID, Content, UserID)
        OUTPUT inserted.NoteID, inserted.ChapterID, inserted.ScriptID, inserted.Content, inserted.CreatedAt, inserted.UserID
        VALUES (@ChapterID, @ScriptID, @Content, @UserID)
      `);

    return new Response(JSON.stringify(result.recordset[0]), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
