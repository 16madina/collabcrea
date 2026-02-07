import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search, Users, Briefcase } from "lucide-react";
import AdminUserCard from "./AdminUserCard";
import { useToast } from "@/hooks/use-toast";

interface UserWithRole {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  email_verified: boolean | null;
  identity_verified: boolean | null;
  is_banned: boolean | null;
  country: string | null;
  category: string | null;
  company_name: string | null;
  role: "creator" | "brand";
}

type ProfileRow = {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  email_verified: boolean | null;
  identity_verified: boolean | null;
  is_banned: boolean | null;
  country: string | null;
  category: string | null;
  company_name: string | null;
};

const AdminUsersTab = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [userType, setUserType] = useState<"creator" | "brand">("creator");
  const { toast } = useToast();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Fetch profiles with their roles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*");

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("role", ["creator", "brand"]);

      if (rolesError) throw rolesError;

      // Combine profiles with roles
      const usersWithRoles: UserWithRole[] = (profiles as ProfileRow[])
        .map((profile) => {
          const userRole = roles.find((r) => r.user_id === profile.user_id);
          if (!userRole || (userRole.role !== "creator" && userRole.role !== "brand")) return null;
          return {
            id: profile.id,
            user_id: profile.user_id,
            full_name: profile.full_name,
            avatar_url: profile.avatar_url,
            email_verified: profile.email_verified,
            identity_verified: profile.identity_verified,
            is_banned: profile.is_banned,
            country: profile.country,
            category: profile.category,
            company_name: profile.company_name,
            role: userRole.role as "creator" | "brand",
          };
        })
        .filter((u): u is UserWithRole => u !== null);

      setUsers(usersWithRoles);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les utilisateurs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter((user) => {
    const matchesType = user.role === userType;
    const matchesSearch =
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.country?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleUserUpdated = () => {
    fetchUsers();
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un utilisateur..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* User Type Tabs */}
      <Tabs value={userType} onValueChange={(v) => setUserType(v as "creator" | "brand")}>
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="creator" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Créateurs ({users.filter((u) => u.role === "creator").length})
          </TabsTrigger>
          <TabsTrigger value="brand" className="flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            Marques ({users.filter((u) => u.role === "brand").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="creator" className="mt-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Chargement...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Aucun créateur trouvé</div>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map((user) => (
                <AdminUserCard key={user.id} user={user} onUserUpdated={handleUserUpdated} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="brand" className="mt-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Chargement...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Aucune marque trouvée</div>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map((user) => (
                <AdminUserCard key={user.id} user={user} onUserUpdated={handleUserUpdated} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminUsersTab;
