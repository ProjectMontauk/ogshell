import React from "react";

const Footer = () => (
  <footer className="w-full bg-white h-25 pt-2 border-t-2 border-gray-200 shadow flex flex-col justify-center">
    <div className="w-full max-w-6xl mx-auto px-4 md:px-6 lg:px-8">
      <div className="py-1 px-3 rounded-md text-xs font-semibold text-black bg-white transition" style={{minWidth: 0}}>
        Contact:
      </div>
      <div className="py-1 px-3 rounded-md text-xs font-semibold text-black bg-white transition" style={{minWidth: 0}}>
        info@thecitizen.io
      </div>
    </div>
  </footer>
);

export default Footer; 