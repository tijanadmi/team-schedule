import Header from "./Header";
import Footer from "./Footer";

export default function Layout({ children }) {
  return (
    <>
      <Header />
      <div className="flex-1 py-12 grid">
        <main className="max-w-7xl mx-auto w-full">{children}</main>
      </div>
      {/* <main>{children}</main> */}
      <Footer />
    </>
  );
}
