// "use client";

// import Link from "next/link";
// import Image from "next/image";
// import { useState, useRef, useEffect } from "react";
// import Navigation from "./Navigation";

// export default function Header({ user }) {
//   const [isOpen, setIsOpen] = useState(false);
//   const menuRef = useRef(null);

//   useEffect(() => {
//     function handleClickOutside(event) {
//       if (menuRef.current && !menuRef.current.contains(event.target)) {
//         setIsOpen(false);
//       }
//     }

//     document.addEventListener("mousedown", handleClickOutside);

//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//     };
//   }, []);

//   const now = new Date();
//   const currentYear = now.getFullYear();
//   const currentMonth = now.getMonth() + 1;

//   return (
//     <header className="fixed top-0 left-0 w-full bg-white shadow-md z-50">
//       <div className="w-full flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4">
//         <Link
//           href={`/dashboard/${currentYear}/${currentMonth}`}
//           className="flex items-center gap-2"
//         >
//           <Image src="/logo.png" alt="ТИС лого" width={40} height={40} />

//           <span className="text-lg sm:text-xl md:text-2xl text-blue-800 font-light tracking-wide">
//             Евиденција
//           </span>
//         </Link>

//         <div className="hidden md:block">
//           <Navigation user={user} onLinkClick={() => setIsOpen(false)} />
//         </div>

//         <button onClick={() => setIsOpen(!isOpen)} className="md:hidden p-2">
//           ☰
//         </button>
//       </div>

//       {isOpen && (
//         <>
//           <div className="fixed inset-0 bg-black/20 md:hidden" />
//           <div ref={menuRef} className="md:hidden px-4 pb-4 relative bg-white">
//             <Navigation user={user} onLinkClick={() => setIsOpen(false)} />
//           </div>
//         </>
//       )}
//     </header>
//   );
// }

"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import Navigation from "./Navigation";

export default function Header({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="fixed top-0 left-0 w-full bg-white shadow-md z-50">
      <div className="w-full flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4">
        <Link
          href={`/dashboard/${currentYear}/${currentMonth}`}
          className="flex items-center gap-2"
        >
          <Image src="/logo.png" alt="ТИС лого" width={40} height={40} />

          <span className="text-lg sm:text-xl md:text-2xl text-blue-800 font-light tracking-wide">
            Евиденција
          </span>
        </Link>

        {/* Desktop navigation */}
        <div className="hidden md:block">
          <Navigation user={user} />
        </div>

        {/* Mobile button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden p-2 text-2xl"
        >
          {isOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile menu */}
      {/* <div
        className={`md:hidden transition-all duration-300 overflow-hidden ${
          isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div ref={menuRef} className="bg-white px-4 pb-4 shadow-md border-t">
          <Navigation user={user} onLinkClick={() => setIsOpen(false)} />
        </div>
      </div> */}

      <div
        className={`md:hidden transition-all duration-300 overflow-hidden ${
          isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div
          ref={menuRef}
          className="bg-white px-4 pb-4 shadow-md border-t relative z-50"
        >
          <Navigation user={user} onLinkClick={() => setIsOpen(false)} />
        </div>
      </div>

      {/* Overlay */}
      {/* {isOpen && <div className="fixed inset-0 bg-black/20 md:hidden -z-10" />} */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 md:hidden z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </header>
  );
}
