import Link from "next/link";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

export function MainNav({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname();

  return (
    <nav
      className={cn("flex items-center justify-between w-full", className)}
      {...props}
    >
      <div className="flex items-center space-x-4 lg:space-x-6">
        <Link
          href="/app"
          className={cn(
            "text-sm font-medium transition-colors hover:text-primary",
            pathname === "/app" ? "text-primary" : "text-muted-foreground"
          )}
        >
          Overview
        </Link>
        <Link
          href="/resume-reader"
          className={cn(
            "text-sm font-medium transition-colors hover:text-primary",
            pathname === "/resume-reader" ? "text-primary" : "text-muted-foreground"
          )}
        >
          Upload Resume
        </Link>
        <Link
          href="#"
          className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          Upload Info
        </Link>
      </div>
      <Link href="/interview">
        <Button>Interview Now</Button>
      </Link>
    </nav>
  );
}
