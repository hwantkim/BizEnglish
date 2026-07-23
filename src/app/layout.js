import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata = {
  title: 'BizEnglish - 비즈니스 영어 학습',
  description: '12개 챕터로 구성된 비즈니스 영어 학습 플랫폼. 듣기, 말하기, 쓰기 연습 및 개인 학습 계획 관리.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={inter.variable} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
