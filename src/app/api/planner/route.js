import { connectToDatabase } from '@/db';
import sql from 'mssql';

export const runtime = 'nodejs';

// 플래너 정보 조회
export async function GET() {
  try {
    const pool = await connectToDatabase();
    
    const result = await pool.request().query('SELECT TOP 1 * FROM Planner');
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
    const { targetDays, chaptersPerDay } = await request.json();
    const pool = await connectToDatabase();

    // 단일 행 업데이트 (Planner에 데이터가 없으면 삽입, 있으면 업데이트)
    const checkResult = await pool.request().query('SELECT COUNT(*) as count FROM Planner');
    const hasRow = checkResult.recordset[0].count > 0;

    let query = '';
    if (hasRow) {
      query = `
        UPDATE Planner 
        SET TargetDays = @TargetDays, ChaptersPerDay = @ChaptersPerDay
        OUTPUT inserted.*
      `;
    } else {
      query = `
        INSERT INTO Planner (TargetDays, ChaptersPerDay)
        OUTPUT inserted.*
        VALUES (@TargetDays, @ChaptersPerDay)
      `;
    }

    const result = await pool.request()
      .input('TargetDays', sql.NVarChar, targetDays)
      .input('ChaptersPerDay', sql.Int, chaptersPerDay)
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
