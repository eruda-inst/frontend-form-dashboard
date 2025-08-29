import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { MenubarMenuData, MenubarItemData, MenubarContentItem } from "@/app/types/menubar";

interface DynamicMenubarProps {
  menuData: MenubarMenuData[];
}

// Helper function to render content items
function renderContentItem(item: MenubarContentItem, itemIndex: number) {
  if ('label' in item) { // This is a MenubarItemData
    return (
      <div key={itemIndex}>
        {item.separator && <MenubarSeparator />}
        <MenubarItem onClick={item.onClick}>
          {item.label} {item.shortcut && <MenubarShortcut>{item.shortcut}</MenubarShortcut>}
        </MenubarItem>
      </div>
    );
  } else { // This is a MenubarMenuData (nested menu)
    return (
      <MenubarMenu key={itemIndex}>
        <MenubarTrigger>{item.trigger}</MenubarTrigger>
        <MenubarContent>
          {item.content.map((subItem, subItemIndex) => renderContentItem(subItem, subItemIndex))}
        </MenubarContent>
      </MenubarMenu>
    );
  }
}

export function DynamicMenubar({ menuData }: DynamicMenubarProps) {
  return (
    <Menubar>
      {menuData.map((menu, menuIndex) => (
        <MenubarMenu key={menuIndex}>
          <MenubarTrigger>{menu.trigger}</MenubarTrigger>
          <MenubarContent>
            {menu.content.map((item, itemIndex) => renderContentItem(item, itemIndex))}
          </MenubarContent>
        </MenubarMenu>
      ))}
    </Menubar>
  );
}