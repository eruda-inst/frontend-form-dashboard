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
            {menu.content.map((item, itemIndex) => (
              <div key={itemIndex}>
                {item.separator && <MenubarSeparator />}
                <MenubarItem onClick={item.onClick}>
                  {item.label} {item.shortcut && <MenubarShortcut>{item.shortcut}</MenubarShortcut>}
                </MenubarItem>
              </div>
            ))}
          </MenubarContent>
        </MenubarMenu>
      ))}
    </Menubar>
  );
}