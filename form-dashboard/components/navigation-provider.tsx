"use client"
import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react"
import { usePathname } from "next/navigation"
import Cookies from "js-cookie"

export interface BreadcrumbItem {
  title: string
  url?: string
}

interface NavigationContextValue {
  activeTitle: string
  setActiveTitle: (title: string) => void
  breadcrumbs: BreadcrumbItem[]
  setBreadcrumbs: (breadcrumbs: BreadcrumbItem[]) => void
}

const NavigationContext = createContext<NavigationContextValue | undefined>(
  undefined,
)

const fetchFormName = async (formId: string) => {
  const accessToken = Cookies.get("access_token")
  if (!accessToken) return null

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/formularios/${formId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    )
    if (!res.ok) return null
    const data = await res.json()
    return data.nome // Assumes the form object has a 'nome' property
  } catch (error) {
    
    return null
  }
}

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [activeTitle, setActiveTitle] = useState("Formulários")
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([])
  const [formNamesCache, setFormNamesCache] = useState<Record<string, string>>({})
  const pathname = usePathname()

  useEffect(() => {
    const generateBreadcrumbs = async () => {
      const pathParts = pathname.split("/").filter(part => part && part !== 'dashboard');

      if (pathParts.length === 0) {
        setBreadcrumbs([{ title: "Formulários" }]);
        return;
      }

      const section = pathParts[0];
      let sectionTitle = '';
      let sectionUrl = '';

      switch (section) {
        case 'forms':
          sectionTitle = 'Formulários';
          sectionUrl = '/dashboard/forms';
          break;
        case 'users':
          sectionTitle = 'Usuários';
          sectionUrl = '/dashboard/users';
          break;
        case 'groups':
          sectionTitle = 'Grupos e Permissões';
          sectionUrl = '/dashboard/groups';
          break;
        default:
          sectionTitle = section.charAt(0).toUpperCase() + section.slice(1);
          sectionUrl = `/dashboard/${section}`;
      }

      const newBreadcrumbs: BreadcrumbItem[] = [{ title: sectionTitle, url: sectionUrl }];

      if (section === 'forms' && pathParts.length > 1) {
        const formId = pathParts[1];
        let formName = formNamesCache[formId];
        if (!formName) {
          const fetchedName = await fetchFormName(formId);
          if (fetchedName) {
            formName = fetchedName;
            setFormNamesCache(prev => ({...prev, [formId]: fetchedName}));
          }
        }

        if (formName) {
          const title = formName.length > 20 ? `${formName.substring(0, 20)}...` : formName;
          newBreadcrumbs.push({ title, url: `/dashboard/forms/${formId}` });

          if (pathParts.length > 2) {
            const lastPart = pathParts[2];
            const lastPartTitle = lastPart.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
            newBreadcrumbs.push({ title: lastPartTitle });
          }
        }
      }

      if (newBreadcrumbs.length > 0) {
        newBreadcrumbs[newBreadcrumbs.length - 1].url = undefined;
      }

      setBreadcrumbs(newBreadcrumbs);
    };

    generateBreadcrumbs();
  }, [pathname, formNamesCache])

  return (
    <NavigationContext.Provider
      value={{ activeTitle, setActiveTitle, breadcrumbs, setBreadcrumbs }}
    >
      {children}
    </NavigationContext.Provider>
  )
}

export function useNavigation() {
  const context = useContext(NavigationContext)
  if (!context) {
    throw new Error("useNavigation must be used within NavigationProvider")
  }
  return context
}