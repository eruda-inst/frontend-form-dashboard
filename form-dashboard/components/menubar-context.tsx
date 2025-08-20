"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { MenubarMenuData } from '@/app/types/menubar';

interface MenubarContextType {
  menubarData: MenubarMenuData[];
  setMenubarData: (data: MenubarMenuData[]) => void;
}

const MenubarContext = createContext<MenubarContextType | undefined>(undefined);

export function MenubarProvider({ children }: { children: ReactNode }) {
  const [menubarData, setMenubarData] = useState<MenubarMenuData[]>([]);

  return (
    <MenubarContext.Provider value={{ menubarData, setMenubarData }}>
      {children}
    </MenubarContext.Provider>
  );
}

export function useMenubar() {
  const context = useContext(MenubarContext);
  if (context === undefined) {
    throw new Error('useMenubar must be used within a MenubarProvider');
  }
  return context;
}