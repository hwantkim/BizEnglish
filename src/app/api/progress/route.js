import { connectToDatabase } from '@/db';
import sql from 'mssql';

export const runtime = 'nodejs';

// 전체 진척도 현황 가져오기
export async function GET() {
  try {
    const pool = await connectToDatabase();
    const result = await pool.request().query('SELECT * FROM Progress ORDER BY ChapterID ASC');
    
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
    const { chapterId, listenDone, speakDone, writeDone } = await request.json();
    const pool = await connectToDatabase();

    const result = await pool.request()
      .input('ChapterID', sql.Int, chapterId)
      .input('ListenDone', sql.Bit, listenDone ? 1 : 0)
      .input('SpeakDone', sql.Bit, speakDone ? 1 : 0)
      .input('WriteDone', sql.Bit, writeDone ? 1 : 0)
      .query(`
        MERGE INTO Progress AS target
        USING (SELECT @ChapterID AS ChapterID) AS source
        ON (target.ChapterID = source.ChapterID)
        WHEN MATCHED THEN
          UPDATE SET 
            ListenDone = @ListenDone, 
            SpeakDone = @SpeakDone, 
            WriteDone = @WriteDone, 
            UpdatedAt = GETDATE()
        WHEN NOT MATCHED THEN
          INSERT (ChapterID, ListenDone, SpeakDone, WriteDone, UpdatedAt)
          VALUES (source.ChapterID, @ListenDone, @SpeakDone, @WriteDone, GETDATE())
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
