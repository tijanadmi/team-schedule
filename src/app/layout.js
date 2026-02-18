import "./globals.css";
import { Poppins } from "next/font/google";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const metadata = {
  title: {
    template: "%s / TIS",
    default: "Dobrodošli / TIS Evidencija",
  },
  description: "Stranica za evidenciju radnog vremena u TIS-u.",
  icons: {
    icon: "/favicon.ico", // obavezno favicon u public folderu
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="sr">
      <body className={`${poppins.className}`}>{children}</body>
    </html>
  );
}
