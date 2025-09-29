"use client";

import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

export function PopoverTest() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline">
          Test Popover
        </Button>
      </PopoverTrigger>
      <PopoverContent className="bg-white border p-4">
        Hello world 👋
      </PopoverContent>
    </Popover>
  );
}
