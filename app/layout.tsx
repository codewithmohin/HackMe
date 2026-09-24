import "./globals.css";
import { AppProviders } from "@/components/providers";
export const metadata={title:"HackMe — Create. Host. Hack.",description:"Student-first hackathon management platform."};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><AppProviders>{children}</AppProviders></body></html>}
