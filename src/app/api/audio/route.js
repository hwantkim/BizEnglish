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
    if (!connectionString) {
      throw new Error('AZURE_STORAGE_CONNECTION_STRING 환경 변수가 설정되지 않았습니다.');
    }
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    
    // URL에서 컨테이너명과 경로 파싱
    const urlObj = new URL(blobUrl);
    const pathParts = urlObj.pathname.split('/');
    // pathParts: ["", "biz-english-store", "mp3", "01 bltg_01_Interviews.mp3"]
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

    return new Response(downloadResponse.readableStreamBody, {
      status: 200,
      headers
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
