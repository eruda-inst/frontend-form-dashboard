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
  setPageBreadcrumbs: (items: BreadcrumbItem[]) => void
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
  const [pageBreadcrumbs, setPageBreadcrumbs] = useState<BreadcrumbItem[]>([])
  const [formNamesCache, setFormNamesCache] = useState<Record<string, string>>({})
  const pathname = usePathname()

  useEffect(() => {
    const generateBreadcrumbsAndTitle = async () => {
      const pathParts = pathname.split("/").filter(part => part); // e.g. ['formularios', '123']

      if (pathParts.length === 0) { // Just /
        setActiveTitle("Formulários");
        setBreadcrumbs([{ title: "Formulários" }]);
        return;
      }

      const section = pathParts[0]; // 'formularios', 'usuarios', 'grupos-e-permissoes'
      let sectionTitle = '';
      let sectionUrl = '';
      let newActiveTitle = '';

      switch (section) {
        case 'formularios':
          sectionTitle = 'Formulários';
          newActiveTitle = 'Formulários';
          sectionUrl = '/formularios';
          break;
        case 'usuarios':
          sectionTitle = 'Usuários';
          newActiveTitle = 'Usuários';
          sectionUrl = '/usuarios';
          break;
        case 'grupos-e-permissoes':
          sectionTitle = 'Grupos e Permissões';
          newActiveTitle = 'Grupos e Permissoes';
          sectionUrl = '/grupos-e-permissoes';
          break;
        default:
          // Handle other sections if any
          const capitalized = section.charAt(0).toUpperCase() + section.slice(1);
          sectionTitle = capitalized;
          newActiveTitle = capitalized;
          sectionUrl = `/${section}`;
      }

      setActiveTitle(newActiveTitle);
      const baseBreadcrumbs: BreadcrumbItem[] = [{ title: sectionTitle, url: sectionUrl }];
      const combinedBreadcrumbs = [...baseBreadcrumbs, ...pageBreadcrumbs];

      // Make last breadcrumb not a link
      if (combinedBreadcrumbs.length > 0) {
        combinedBreadcrumbs[combinedBreadcrumbs.length - 1].url = undefined;
      }

      setBreadcrumbs(combinedBreadcrumbs);
    };

    generateBreadcrumbsAndTitle();
  }, [pathname, pageBreadcrumbs])

  // New useEffect to clear pageBreadcrumbs when navigating to a top-level section
  useEffect(() => {
    const pathParts = pathname.split("/").filter(part => part);
    // If the path has only one part (e.g., ['formularios']), it's a top-level section.
    // In this case, clear any dynamic breadcrumbs that might have been set by a deeper page.
    if (pathParts.length <= 1) { // <= 1 to also cover the root path "/"
      setPageBreadcrumbs([]);
    }
  }, [pathname, setPageBreadcrumbs]);


  return (
    <NavigationContext.Provider
      value={{ activeTitle, setActiveTitle, breadcrumbs, setPageBreadcrumbs }}
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