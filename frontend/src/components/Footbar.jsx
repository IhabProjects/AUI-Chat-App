import React from "react";
import { Heart } from "lucide-react";

const Footbar = () => {
  return (
    <footer className="bg-base-100 border-b border-base-300 fixed w-full bottom-0 z-40 backdrop-blur-lg bg-base-100/80">
      <p className="flex items-center justify-center gap-2">
        Crafted with <Heart className="w-4 h-4 text-red-500 fill-current" /> by Ihab In Honor of Mark Zuckerberg
      </p>
    </footer>
  );
};

export default Footbar;
