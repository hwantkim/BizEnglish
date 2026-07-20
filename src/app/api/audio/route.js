import { BlobServiceClient } from '@azure/storage-blob';

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
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    
    // 만약 스토리지 연결 스트링 환경 변수가 비어 있다면, 공용 URL로 직접 307 Redirect 유도 (CORS 허용 시 가장 효과적)
    if (!connectionString) {
      console.warn('AZURE_STORAGE_CONNECTION_STRING이 설정되지 않았으므로 직접 Blob URL로 Redirect합니다.');
      return new Response(null, {
        status: 307,
        headers: {
          'Location': blobUrl,
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    
    // URL에서 컨테이너명과 경로 파싱
    const urlObj = new URL(blobUrl);
    const pathParts = urlObj.pathname.split('/');
    const containerName = pathParts[1];
    const blobName = decodeURIComponent(pathParts.slice(2).join('/'));

    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blobClient = containerClient.getBlobClient(blobName);

    // 오디오 다운로드 스트림 생성
    const downloadResponse = await blobClient.download(0);

    // 브라우저가 오디오 파일로 정확히 해석하도록 audio/mpeg 설정
    const headers = new Headers();
    headers.set('Content-Type', 'audio/mpeg');
    headers.set('Content-Length', downloadResponse.contentLength.toString());
    headers.set('Accept-Ranges', 'bytes');
    headers.set('Access-Control-Allow-Origin', '*');

    return new Response(downloadResponse.readableStreamBody, {
      status: 200,
      headers
    });
  } catch (error) {
    // 에러 발생 시에도 최후의 수단으로 public URL 다이렉트 리다이렉트 시도
    console.error('오디오 스트리밍 프록시 오류, public URL 리다이렉트 시도:', error.message);
    return new Response(null, {
      status: 307,
      headers: {
        'Location': blobUrl,
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}
