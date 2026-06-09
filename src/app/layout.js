import "./globals.css";

export const metadata = {
  title: "Twilio Web Dialer",
  description: "A premium browser-based VoIP dialer using Twilio",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
