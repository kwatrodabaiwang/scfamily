import './index.css';
import DevtoolBlocker from '@/components/DevtoolBlocker';

export const metadata = {
  title: 'Scaletta Crime Family',
  description: 'Loyalty. Respect. Omerta.',
  icons: { icon: '/assets/logo.png' },
  openGraph: {
    title: 'Scaletta Crime Family',
    description: 'Loyalty. Respect. Omerta.',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <DevtoolBlocker />
        {children}
      </body>
    </html>
  );
}
