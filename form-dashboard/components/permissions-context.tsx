"use client";

import { User } from "@/app/types/user";
import { createContext, useContext, useEffect, useState } from "react";

export interface Permission {
  id: string;
  codigo: string;
  nome: string;
}

export interface Group {
  id: string;
  nome: string;
  permissoes: Permission[];
}

interface PermissionsContextType {
  permissions: string[];
  loading: boolean;
  hasPermission: (permission: string) => boolean;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(
  undefined
);

export const usePermissions = () => {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error(
      "usePermissions must be used within a PermissionsProvider"
    );
  }
  return context;
};

export const PermissionsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPermissions = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/user/permissions");
        if (response.ok) {
          const data = await response.json(); // This is the object like { usuario: '...', permissoes: [...] }
          const permissionsList = data.permissoes || []; // Get the array of strings

          // Ensure it's an array of strings before setting state
          if (Array.isArray(permissionsList) && permissionsList.every(p => typeof p === 'string')) {
            setPermissions(permissionsList);
          } else {
            console.error("PermissionsProvider: API response field 'permissoes' is not an array of strings.", data);
            setPermissions([]);
          }
        } else {
          console.error("PermissionsProvider: Response not OK", response);
          setPermissions([]);
        }
      } catch (error) {
        console.error("PermissionsProvider: Failed to fetch permissions", error);
        setPermissions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, []);

  const hasPermission = (permission: string) => {
    return permissions.includes(permission);
  };

  return (
    <PermissionsContext.Provider value={{ permissions, loading, hasPermission }}>
      {children}
    </PermissionsContext.Provider>
  );
};
