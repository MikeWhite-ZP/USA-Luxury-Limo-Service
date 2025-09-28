import { useQuery } from "@tanstack/react-query";

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: 'passenger' | 'driver' | 'admin';
  profileImageUrl?: string;
  phone?: string;
  isActive: boolean;
  stripeCustomerId?: string;
  createdAt: string;
  updatedAt: string;
}

export function useAuth() {
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}
