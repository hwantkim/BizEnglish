export const runtime = 'nodejs';

// 로그아웃 처리 및 세션 쿠키 초기화
export async function POST() {
  const headers = new Headers();
  headers.set('Content-Type', 'application/json');
  // 쿠키 만료시간을 즉시 만료(Max-Age=0)시켜 지우기
  headers.set('Set-Cookie', 'biz_user_id=; Path=/; Max-Age=0; SameSite=Lax');

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers
  });
}
