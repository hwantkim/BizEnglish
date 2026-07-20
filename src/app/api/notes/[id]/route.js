export const runtime = 'nodejs';

import { connectToDatabase } from '@/db';
import sql from 'mssql';
import { getUserIdFromRequest } from '../../auth/me/route';

// 메모 삭제 API
export async function DELETE(request, { params }) {
  const { id } = await params;
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return new Response(JSON.stringify({ error: '인증이 만료되었습니다. 다시 로그인해 주세요.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const pool = await connectToDatabase();
    
    await pool.request()
      .input('NoteID', sql.Int, id)
      .input('UserID', sql.Int, userId)
      .query('DELETE FROM Notes WHERE NoteID = @NoteID AND UserID = @UserID');

    return new Response(JSON.stringify({ success: true }), {
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

// 메모 수정 API
export async function PUT(request, { params }) {
  const { id } = await params;
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return new Response(JSON.stringify({ error: '인증이 만료되었습니다. 다시 로그인해 주세요.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { content } = await request.json();
    if (!content) {
      return new Response(JSON.stringify({ error: 'content is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const pool = await connectToDatabase();
    
    const result = await pool.request()
      .input('NoteID', sql.Int, id)
      .input('Content', sql.NVarChar, content)
      .input('UserID', sql.Int, userId)
      .query(`
        UPDATE Notes 
        SET Content = @Content
        OUTPUT inserted.NoteID, inserted.ChapterID, inserted.ScriptID, inserted.Content, inserted.CreatedAt
        WHERE NoteID = @NoteID AND UserID = @UserID
      `);

    if (result.recordset.length === 0) {
      return new Response(JSON.stringify({ error: 'Note not found or permission denied' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify(result.recordset[0]), {
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
