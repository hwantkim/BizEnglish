export const runtime = 'nodejs';

import { connectToDatabase } from '@/db';
import sql from 'mssql';

export async function GET() {
  try {
    const pool = await connectToDatabase();
    
    // 전체 챕터 조회, 각 챕터별 등록된 스크립트 개수 집계 및 진척도 데이터 조인
    const result = await pool.request().query(`
      SELECT 
        c.ChapterID, 
        c.Title, 
        c.PDFUrl, 
        c.MP3Url,
        ISNULL(p.ListenDone, 0) AS ListenDone,
        ISNULL(p.SpeakDone, 0) AS SpeakDone,
        ISNULL(p.WriteDone, 0) AS WriteDone,
        (SELECT COUNT(*) FROM Scripts s WHERE s.ChapterID = c.ChapterID) AS ScriptCount,
        (SELECT COUNT(*) FROM Vocabulary v WHERE v.ChapterID = c.ChapterID) AS VocabCount,
        (SELECT COUNT(*) FROM Notes n WHERE n.ChapterID = c.ChapterID) AS NoteCount
      FROM Chapters c
      LEFT JOIN Progress p ON c.ChapterID = p.ChapterID
      ORDER BY c.ChapterID ASC
    `);

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
