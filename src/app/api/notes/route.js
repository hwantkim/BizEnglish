export const runtime = 'nodejs';

import { connectToDatabase } from '@/db';
import sql from 'mssql';

// 메모 추가 API
export async function POST(request) {
  try {
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
      .query(`
        INSERT INTO Notes (ChapterID, ScriptID, Content)
        OUTPUT inserted.NoteID, inserted.ChapterID, inserted.ScriptID, inserted.Content, inserted.CreatedAt
        VALUES (@ChapterID, @ScriptID, @Content)
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
