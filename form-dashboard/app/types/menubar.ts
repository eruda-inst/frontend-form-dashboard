export interface MenubarItemData {
  label: string;
  onClick?: () => void;
  shortcut?: string;
  separator?: boolean;
  component?: React.ReactNode;
}

export interface MenubarMenuData {
  trigger: string;
  content: MenubarContentItem[];
}

export type MenubarContentItem = MenubarItemData | MenubarMenuData;