export const runtime = 'nodejs';

import { connectToDatabase } from '@/db';
import sql from 'mssql';
import { getUserIdFromRequest } from '../auth/me/route';

// 전체 진척도 현황 가져오기
export async function GET(request) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const pool = await connectToDatabase();
    const result = await pool.request()
      .input('UserID', sql.Int, userId)
      .query('SELECT * FROM Progress WHERE UserID = @UserID ORDER BY ChapterID ASC');
    
    return new Response(JSON.stringify(result.recordset), {
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

// 특정 챕터 학습완료 여부 토글 / 업데이트
export async function POST(request) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return new Response(JSON.stringify({ error: '로그인이 필요합니다.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { chapterId, listenDone, speakDone, writeDone } = await request.json();
    const pool = await connectToDatabase();

    const result = await pool.request()
      .input('ChapterID', sql.Int, chapterId)
      .input('UserID', sql.Int, userId)
      .input('ListenDone', sql.Bit, listenDone ? 1 : 0)
      .input('SpeakDone', sql.Bit, speakDone ? 1 : 0)
      .input('WriteDone', sql.Bit, writeDone ? 1 : 0)
      .query(`
        MERGE INTO Progress AS target
        USING (SELECT @ChapterID AS ChapterID, @UserID AS UserID) AS source
        ON (target.ChapterID = source.ChapterID AND target.UserID = source.UserID)
        WHEN MATCHED THEN
          UPDATE SET 
            ListenDone = @ListenDone, 
            SpeakDone = @SpeakDone, 
            WriteDone = @WriteDone, 
            UpdatedAt = GETDATE()
        WHEN NOT MATCHED THEN
          INSERT (ChapterID, UserID, ListenDone, SpeakDone, WriteDone, UpdatedAt)
          VALUES (source.ChapterID, source.UserID, @ListenDone, @SpeakDone, @WriteDone, GETDATE())
        OUTPUT inserted.*;
      `);

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
