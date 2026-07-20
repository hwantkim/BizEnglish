import { connectToDatabase } from '@/db';
import sql from 'mssql';
import { getUserIdFromRequest } from '../../auth/me/route';

export async function GET(request, { params }) {
  const { id } = await params;
  try {
    const userId = getUserIdFromRequest(request);
    const pool = await connectToDatabase();
    
    // 1. 챕터 기본 정보 및 로그인한 사용자의 진도 정보 조회
    const chapterResult = await pool.request()
      .input('ChapterID', sql.Int, id)
      .input('UserID', sql.Int, userId || -1)
      .query(`
        SELECT 
          c.*,
          ISNULL(p.ListenDone, 0) AS ListenDone,
          ISNULL(p.SpeakDone, 0) AS SpeakDone,
          ISNULL(p.WriteDone, 0) AS WriteDone
        FROM Chapters c
        LEFT JOIN Progress p ON c.ChapterID = p.ChapterID AND p.UserID = @UserID
        WHERE c.ChapterID = @ChapterID
      `);
      
    if (chapterResult.recordset.length === 0) {
      return new Response(JSON.stringify({ error: 'Chapter not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const chapter = chapterResult.recordset[0];

    // 2. 대화 스크립트 조회
    const scriptsResult = await pool.request()
      .input('ChapterID', sql.Int, id)
      .query('SELECT * FROM Scripts WHERE ChapterID = @ChapterID ORDER BY Sequence ASC');

    // 3. 단어장 조회
    const vocabResult = await pool.request()
      .input('ChapterID', sql.Int, id)
      .query('SELECT * FROM Vocabulary WHERE ChapterID = @ChapterID');

    // 4. 로그인한 사용자의 메모만 조회 (또는 가입이 안 된 기본 테스트용 챕터 메모 노출)
    const notesResult = await pool.request()
      .input('ChapterID', sql.Int, id)
      .input('UserID', sql.Int, userId || -1)
      .query('SELECT * FROM Notes WHERE ChapterID = @ChapterID AND (UserID = @UserID OR UserID IS NULL) ORDER BY CreatedAt DESC');

    const responseData = {
      chapter,
      scripts: scriptsResult.recordset,
      vocabulary: vocabResult.recordset,
      notes: notesResult.recordset
    };

    return new Response(JSON.stringify(responseData), {
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
