import { Wrench } from "lucide-react";

export const Footer = () => {
  return (
    <footer>
      <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
          <Wrench />
          <p className="text-center text-sm leading-loose md:text-left">
            LETS BUILD
          </p>
        </div>
      </div>
    </footer>
  );
};
