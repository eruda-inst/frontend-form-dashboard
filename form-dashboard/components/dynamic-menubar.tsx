import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { MenubarMenuData } from "@/app/types/menubar";

interface DynamicMenubarProps {
  menuData: MenubarMenuData[];
}

export function DynamicMenubar({ menuData }: DynamicMenubarProps) {
  return (
    <Menubar>
      {menuData.map((menu, menuIndex) => (
        <MenubarMenu key={menuIndex}>
          <MenubarTrigger>{menu.trigger}</MenubarTrigger>
          <MenubarContent>
            {menu.content.map((item, itemIndex) => {
              if ("label" in item) {
                const menuItem = item as MenubarItemData;
                return (
                  <div key={itemIndex}>
                    {menuItem.separator && <MenubarSeparator />}
                    <MenubarItem onClick={menuItem.onClick}>
                      {menuItem.label} {menuItem.shortcut && <MenubarShortcut>{menuItem.shortcut}</MenubarShortcut>}
                    </MenubarItem>
                  </div>
                );
              } else {
                // This case handles nested MenubarMenuData, if applicable
                // For now, we'll assume it's always MenubarItemData based on the original error.
                // If nested menus are intended, this part needs further implementation.
                return null; // Or handle the nested menu structure
              }
            })}
          </MenubarContent>
        </MenubarMenu>
      ))}
    </Menubar>
  );
}