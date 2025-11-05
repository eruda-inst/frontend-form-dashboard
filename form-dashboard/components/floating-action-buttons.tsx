"use client"

import { Button } from "@/components/ui/button"
import { Library } from "lucide-react"

interface FloatingActionButtonsProps {
  onAddBlockClick: () => void;
}

export function FloatingActionButtons({ onAddBlockClick }: FloatingActionButtonsProps) {

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <Button
        className="shadow-lg"
        onClick={onAddBlockClick}
      >
        <Library className="mr-2 h-4 w-4" />
        Novo Bloco
      </Button>
    </div>
  )
}
