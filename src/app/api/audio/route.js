export const runtime = 'nodejs';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const blobUrl = searchParams.get('url');

  if (!blobUrl) {
    return new Response(JSON.stringify({ error: 'url parameter is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const rangeHeader = request.headers.get('range');

    // Azure Blob에 Range 헤더를 그대로 전달 (얇은 프록시)
    const fetchHeaders = {};
    if (rangeHeader) {
      fetchHeaders['Range'] = rangeHeader;
    }

    const azureResponse = await fetch(blobUrl, { headers: fetchHeaders });

    // 필수 헤더 구성
    // - Accept-Ranges: bytes  → 브라우저가 Seek(탐색)를 위한 Range 요청을 보낼 수 있게 함 (핵심!)
    // - Azure 원본은 이 헤더를 응답에 포함하지 않아 브라우저가 탐색 불가로 판단하는 문제를 해결
    const responseHeaders = new Headers();
    responseHeaders.set('Content-Type', azureResponse.headers.get('Content-Type') || 'audio/mpeg');
    responseHeaders.set('Accept-Ranges', 'bytes');
    responseHeaders.set('Access-Control-Allow-Origin', '*');

    const contentLength = azureResponse.headers.get('Content-Length');
    if (contentLength) responseHeaders.set('Content-Length', contentLength);

    const contentRange = azureResponse.headers.get('Content-Range');
    if (contentRange) responseHeaders.set('Content-Range', contentRange);

    // Azure 응답 스트림을 그대로 전달 (버퍼링 없이 스트리밍)
    return new Response(azureResponse.body, {
      status: azureResponse.status,
      headers: responseHeaders
    });

  } catch (error) {
    console.error('오디오 스트리밍 프록시 오류:', error.message);
    // 최후 수단: 클라이언트가 Azure URL로 직접 접근하도록 리다이렉트
    return new Response(null, {
      status: 307,
      headers: {
        'Location': blobUrl,
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}
