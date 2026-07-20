import { connectToDatabase } from '@/db';
import sql from 'mssql';
import { getUserIdFromRequest } from '../auth/me/route';

export const runtime = 'nodejs';

// 플래너 정보 조회
export async function GET(request) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return new Response(JSON.stringify({ TargetDays: '월,수,금', ChaptersPerDay: 1 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const pool = await connectToDatabase();
    
    const result = await pool.request()
      .input('UserID', sql.Int, userId)
      .query('SELECT TOP 1 * FROM Planner WHERE UserID = @UserID');
      
    const planner = result.recordset[0] || { TargetDays: '월,수,금', ChaptersPerDay: 1 };

    return new Response(JSON.stringify(planner), {
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

// 플래너 설정 변경
export async function POST(request) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return new Response(JSON.stringify({ error: '로그인이 필요합니다.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { targetDays, chaptersPerDay } = await request.json();
    const pool = await connectToDatabase();

    // 로그인한 사용자의 플래너가 존재하는지 체크
    const checkResult = await pool.request()
      .input('UserID', sql.Int, userId)
      .query('SELECT COUNT(*) as count FROM Planner WHERE UserID = @UserID');
    const hasRow = checkResult.recordset[0].count > 0;

    let query = '';
    if (hasRow) {
      query = `
        UPDATE Planner 
        SET TargetDays = @TargetDays, ChaptersPerDay = @ChaptersPerDay
        OUTPUT inserted.*
        WHERE UserID = @UserID
      `;
    } else {
      query = `
        INSERT INTO Planner (TargetDays, ChaptersPerDay, UserID)
        OUTPUT inserted.*
        VALUES (@TargetDays, @ChaptersPerDay, @UserID)
      `;
    }

    const result = await pool.request()
      .input('TargetDays', sql.NVarChar, targetDays)
      .input('ChaptersPerDay', sql.Int, chaptersPerDay)
      .input('UserID', sql.Int, userId)
      .query(query);

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
