import { connectToDatabase } from '@/db';
import sql from 'mssql';
import { getUserIdFromRequest } from '../auth/me/route';

export async function GET(request) {
  try {
    const userId = getUserIdFromRequest(request);
    const pool = await connectToDatabase();
    
    // 전체 챕터 조회, 로그인한 사용자(UserID)별 진척도 데이터 LEFT JOIN 및 메모 개수 집계
    const result = await pool.request()
      .input('UserID', sql.Int, userId || -1)
      .query(`
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
          (SELECT COUNT(*) FROM Notes n WHERE n.ChapterID = c.ChapterID AND (n.UserID = @UserID OR n.UserID IS NULL)) AS NoteCount
        FROM Chapters c
        LEFT JOIN Progress p ON c.ChapterID = p.ChapterID AND p.UserID = @UserID
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
