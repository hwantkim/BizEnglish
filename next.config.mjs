/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['mssql', 'tedious', '@azure/storage-blob'],
};

export default nextConfig;
