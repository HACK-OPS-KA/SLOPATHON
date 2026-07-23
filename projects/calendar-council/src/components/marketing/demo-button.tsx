"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { enterDemoAction } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";

function Inner({ children, className, ...props }: ButtonProps) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className={cn(className)} {...props}>
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" /> Convening…
        </>
      ) : (
        children
      )}
    </Button>
  );
}

export function DemoButton({
  children,
  className,
  ...props
}: ButtonProps) {
  return (
    <form action={enterDemoAction} className="contents">
      <Inner className={className} {...props}>
        {children}
      </Inner>
    </form>
  );
}
