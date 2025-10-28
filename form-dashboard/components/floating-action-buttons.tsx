"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus, FilePlus, Library } from "lucide-react"

interface FloatingActionButtonsProps {
  onAddQuestionClick: () => void;
  onAddBlockClick: () => void;
}

export function FloatingActionButtons({ onAddQuestionClick, onAddBlockClick }: FloatingActionButtonsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleMainClick = () => {
    setIsExpanded(!isExpanded);
  };

  const handleOptionClick = (action: () => void) => {
    action();
    setIsExpanded(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {isExpanded && (
        <div className="flex flex-col items-end gap-3 transition-all duration-300">
          <Button
            variant="secondary"
            onClick={() => handleOptionClick(onAddBlockClick)}
          >
            <Library className="mr-2 h-4 w-4" /> Novo Bloco
          </Button>
          <Button
            variant="secondary"
            onClick={() => handleOptionClick(onAddQuestionClick)}
          >
            <FilePlus className="mr-2 h-4 w-4" /> Nova Questão
          </Button>
        </div>
      )}
      <Button
        className="shadow-lg"
        onClick={handleMainClick}
      >
        <Plus className={`h-4 w-4 mr-2 transition-transform duration-300 ${isExpanded ? 'rotate-45' : ''}`} />
        Novo
      </Button>
    </div>
  )
}
