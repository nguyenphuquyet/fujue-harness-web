const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: [],
  // Bản triển khai gói sẵn server + node_modules cần thiết, để máy chủ chỉ phải
  // giải nén và chạy chứ không cần `npm install` hay `next build`.
  output: "standalone",
};

export default nextConfig;
