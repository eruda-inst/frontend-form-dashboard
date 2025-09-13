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
    const generateBreadcrumbsAndTitle = async () => {
      const pathParts = pathname.split("/").filter(part => part); // e.g. ['dashboard', 'forms', '123']

      if (pathParts.length < 2) { // Just /dashboard
        setActiveTitle("Formulários");
        setBreadcrumbs([{ title: "Formulários" }]);
        return;
      }

      const section = pathParts[1]; // 'forms', 'users', 'groups'
      let sectionTitle = '';
      let sectionUrl = '';
      let newActiveTitle = '';

      switch (section) {
        case 'forms':
          sectionTitle = 'Formulários';
          newActiveTitle = 'Formulários';
          sectionUrl = '/dashboard/forms';
          break;
        case 'users':
          sectionTitle = 'Usuários';
          newActiveTitle = 'Usuários';
          sectionUrl = '/dashboard/users';
          break;
        case 'groups':
          sectionTitle = 'Grupos e Permissões';
          newActiveTitle = 'Grupos e Permissões';
          sectionUrl = '/dashboard/groups';
          break;
        default:
          // Handle other sections if any
          const capitalized = section.charAt(0).toUpperCase() + section.slice(1);
          sectionTitle = capitalized;
          newActiveTitle = capitalized;
          sectionUrl = `/dashboard/${section}`;
      }

      setActiveTitle(newActiveTitle);
      const newBreadcrumbs: BreadcrumbItem[] = [{ title: sectionTitle, url: sectionUrl }];

      // Level 2: Form name
      if (section === 'forms' && pathParts.length > 2) {
        const formId = pathParts[2];
        const formName = formNamesCache[formId] || await fetchFormName(formId);

        if (formName) {
          if (!formNamesCache[formId]) {
            setFormNamesCache(prev => ({...prev, [formId]: formName}));
          }
          
          const title = formName.length > 20 ? `${formName.substring(0, 20)}...` : formName;
          newBreadcrumbs.push({ title, url: `/dashboard/forms/${formId}` });

          // Level 3: Sub-page (edit-questions, operabilities)
          if (pathParts.length > 3) {
            const subPage = pathParts[3];
            let subPageTitle = '';
            if (subPage === 'edit-questions') {
              subPageTitle = 'Questões';
            } else if (subPage === 'operabilities') {
              subPageTitle = 'Operabilidades';
            } else {
                subPageTitle = subPage.charAt(0).toUpperCase() + subPage.slice(1);
            }
            newBreadcrumbs.push({ title: subPageTitle });
          }
        }
      }
      
      // Make last breadcrumb not a link
      if (newBreadcrumbs.length > 0) {
        newBreadcrumbs[newBreadcrumbs.length - 1].url = undefined;
      }

      setBreadcrumbs(newBreadcrumbs);
    };

    generateBreadcrumbsAndTitle();
  }, [pathname])

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