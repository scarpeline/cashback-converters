import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getTeamMembers,
  inviteTeamMember,
  updateMemberRole,
  updateMemberPermissions,
  removeTeamMember,
  reactivateTeamMember,
  resendInvite,
  hasPermission,
  canManageRole,
  DEFAULT_PERMISSIONS,
  ROLE_LABELS,
  ROLE_ICONS,
  type TeamMember,
  type TeamRole,
  type TeamPermissions,
} from "@/services/teamService";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import {
  Users, Plus, Mail, Phone, Crown, Settings, Shield, CheckCircle2, XCircle, Clock,
  RotateCcw, Trash2, Edit3, UserCheck, Loader2, Search, MoreHorizontal, ChevronDown, ChevronRight,
  Calendar, DollarSign, Package, Users2, MessageCircle, Settings2, Eye, EyeOff,
} from "lucide-react";

interface Props {
  barbershopId: string;
}

const PERMISSION_GROUPS = [
  {
    key: "schedule",
    label: "Agenda",
    icon: Calendar,
    permissions: [
      { key: "can_view_schedule", label: "Visualizar agenda" },
      { key: "can_edit_schedule", label: "Editar agenda" },
      { key: "can_view_all_appointments", label: "Ver todos agendamentos" },
      { key: "can_cancel_any_appointment", label: "Cancelar qualquer agendamento" },
    ],
  },
  {
    key: "financial",
    label: "Financeiro",
    icon: DollarSign,
    permissions: [
      { key: "can_view_financial", label: "Visualizar financeiro" },
      { key: "can_edit_financial", label: "Editar financeiro" },
      { key: "can_view_reports", label: "Ver relatórios" },
      { key: "can_process_payments", label: "Processar pagamentos" },
      { key: "can_manage_cashier", label: "Gerenciar caixa" },
    ],
  },
  {
    key: "clients",
    label: "Clientes",
    icon: Users2,
    permissions: [
      { key: "can_view_clients", label: "Visualizar clientes" },
      { key: "can_edit_clients", label: "Editar clientes" },
      { key: "can_manage_loyalty", label: "Gerenciar fidelidade" },
    ],
  },
  {
    key: "inventory",
    label: "Serviços e Produtos",
    icon: Package,
    permissions: [
      { key: "can_view_services", label: "Visualizar serviços" },
      { key: "can_edit_services", label: "Editar serviços" },
      { key: "can_view_inventory", label: "Visualizar estoque" },
      { key: "can_edit_inventory", label: "Editar estoque" },
      { key: "can_manage_packages", label: "Gerenciar pacotes" },
    ],
  },
  {
    key: "marketing",
    label: "Marketing",
    icon: MessageCircle,
    permissions: [
      { key: "can_send_campaigns", label: "Enviar campanhas" },
      { key: "can_manage_automations", label: "Gerenciar automações" },
      { key: "can_manage_reviews", label: "Gerenciar avaliações" },
      { key: "can_access_whatsapp", label: "Acessar WhatsApp" },
    ],
  },
  {
    key: "team",
    label: "Equipe",
    icon: Users,
    permissions: [
      { key: "can_manage_team", label: "Gerenciar equipe" },
      { key: "can_invite_members", label: "Convidar membros" },
      { key: "can_edit_permissions", label: "Editar permissões" },
    ],
  },
  {
    key: "settings",
    label: "Configurações",
    icon: Settings2,
    permissions: [
      { key: "can_view_settings", label: "Visualizar configurações" },
      { key: "can_edit_settings", label: "Editar configurações" },
    ],
  },
];

export function TeamHierarchyPanel({ barbershopId }: Props) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [editingPermissions, setEditingPermissions] = useState<TeamMember | null>(null);

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["team-members", barbershopId],
    queryFn: () => getTeamMembers(barbershopId),
    enabled: !!barbershopId,
  });

  const inviteMutation = useMutation({
    mutationFn: (data: { email: string; name: string; role: TeamRole; phone?: string }) =>
      inviteTeamMember({
        barbershop_id: barbershopId,
        invited_by: user?.id || "",
        ...data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members", barbershopId] });
      setShowInviteForm(false);
      toast({ title: "Convite enviado com sucesso." });
    },
    onError: () => toast({ title: "Erro ao enviar convite.", variant: "destructive" }),
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: TeamRole }) =>
      updateMemberRole(memberId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members", barbershopId] });
      setEditingMember(null);
    },
  });

  const updatePermissionsMutation = useMutation({
    mutationFn: ({ memberId, permissions }: { memberId: string; permissions: TeamPermissions }) =>
      updateMemberPermissions(memberId, permissions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members", barbershopId] });
      setEditingPermissions(null);
    },
  });

  const removeMutation = useMutation({
    mutationFn: removeTeamMember,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["team-members", barbershopId] }),
  });

  const reactivateMutation = useMutation({
    mutationFn: reactivateTeamMember,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["team-members", barbershopId] }),
  });

  const resendMutation = useMutation({
    mutationFn: resendInvite,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["team-members", barbershopId] }),
  });

  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ROLE_LABELS[m.role].toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeMembers = filteredMembers.filter((m) => m.status === "active");
  const invitedMembers = filteredMembers.filter((m) => m.status === "invited");
  const inactiveMembers = filteredMembers.filter((m) => m.status === "inactive" || m.status === "suspended");

  const statusBadge = (status: TeamMember["status"]) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/30">Ativo</Badge>;
      case "invited":
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/30">Convidado</Badge>;
      case "inactive":
        return <Badge className="bg-gray-500/10 text-gray-600 border-gray-500/30">Inativo</Badge>;
      case "suspended":
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/30">Suspenso</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            Hierarquia e Permissões
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Gerencie sua equipe, convide membros e controle permissões de acesso.
          </p>
        </div>
        <Button onClick={() => setShowInviteForm(true)}>
          <Plus className="w-4 h-4 mr-1" />
          Convidar Membro
        </Button>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{members.filter((m) => m.status === "active").length}</p>
            <p className="text-xs text-muted-foreground">Membros ativos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{members.filter((m) => m.status === "invited").length}</p>
            <p className="text-xs text-muted-foreground">Convites pendentes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{members.filter((m) => m.role === "professional").length}</p>
            <p className="text-xs text-muted-foreground">Profissionais</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{members.filter((m) => m.role === "manager").length}</p>
            <p className="text-xs text-muted-foreground">Gerentes</p>
          </CardContent>
        </Card>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, email ou cargo..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Lista de membros */}
      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Ativos ({activeMembers.length})</TabsTrigger>
          <TabsTrigger value="invited">Convidados ({invitedMembers.length})</TabsTrigger>
          <TabsTrigger value="inactive">Inativos ({inactiveMembers.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4">
          <MembersList
            members={activeMembers}
            loading={isLoading}
            onEdit={setEditingMember}
            onEditPermissions={setEditingPermissions}
            onRemove={(id) => removeMutation.mutate(id)}
            statusBadge={statusBadge}
          />
        </TabsContent>

        <TabsContent value="invited" className="mt-4">
          <MembersList
            members={invitedMembers}
            loading={isLoading}
            onResend={(id) => resendMutation.mutate(id)}
            onRemove={(id) => removeMutation.mutate(id)}
            statusBadge={statusBadge}
            showResend
          />
        </TabsContent>

        <TabsContent value="inactive" className="mt-4">
          <MembersList
            members={inactiveMembers}
            loading={isLoading}
            onReactivate={(id) => reactivateMutation.mutate(id)}
            statusBadge={statusBadge}
            showReactivate
          />
        </TabsContent>
      </Tabs>

      {/* Modal de Convite */}
      <Dialog open={showInviteForm} onOpenChange={setShowInviteForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Convidar Membro</DialogTitle>
          </DialogHeader>
          <InviteForm
            onSubmit={(data) => inviteMutation.mutate(data)}
            onCancel={() => setShowInviteForm(false)}
            loading={inviteMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Modal de Edição de Cargo */}
      <Dialog open={!!editingMember} onOpenChange={() => setEditingMember(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Cargo</DialogTitle>
          </DialogHeader>
          {editingMember && (
            <RoleEditor
              member={editingMember}
              onSave={(role) => updateRoleMutation.mutate({ memberId: editingMember.id, role })}
              onCancel={() => setEditingMember(null)}
              loading={updateRoleMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Edição de Permissões */}
      <Dialog open={!!editingPermissions} onOpenChange={() => setEditingPermissions(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Permissões Personalizadas</DialogTitle>
          </DialogHeader>
          {editingPermissions && (
            <PermissionsEditor
              member={editingPermissions}
              onSave={(perms) => updatePermissionsMutation.mutate({ memberId: editingPermissions.id, permissions: perms })}
              onCancel={() => setEditingPermissions(null)}
              loading={updatePermissionsMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Sub-componentes ─────────────────────────────────────────────────────────

function MembersList({
  members,
  loading,
  onEdit,
  onEditPermissions,
  onRemove,
  onReactivate,
  onResend,
  statusBadge,
  showReactivate,
  showResend,
}: {
  members: TeamMember[];
  loading: boolean;
  onEdit?: (m: TeamMember) => void;
  onEditPermissions?: (m: TeamMember) => void;
  onRemove?: (id: string) => void;
  onReactivate?: (id: string) => void;
  onResend?: (id: string) => void;
  statusBadge: (s: TeamMember["status"]) => React.ReactNode;
  showReactivate?: boolean;
  showResend?: boolean;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>Nenhum membro encontrado.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {members.map((member) => (
        <Card key={member.id} className="hover:border-primary/30 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg shrink-0">
                {ROLE_ICONS[member.role]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold truncate">{member.name}</p>
                  {statusBadge(member.status)}
                </div>
                <p className="text-sm text-muted-foreground">{ROLE_LABELS[member.role]}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                  <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {member.email}</span>
                  {member.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {member.phone}</span>}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {showResend && onResend && (
                  <Button size="sm" variant="outline" onClick={() => onResend(member.id)}>
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                )}
                {showReactivate && onReactivate && (
                  <Button size="sm" variant="outline" onClick={() => onReactivate(member.id)}>
                    <CheckCircle2 className="w-4 h-4" />
                  </Button>
                )}
                {onEdit && (
                  <Button size="sm" variant="outline" onClick={() => onEdit(member)}>
                    <Edit3 className="w-4 h-4" />
                  </Button>
                )}
                {onEditPermissions && (
                  <Button size="sm" variant="outline" onClick={() => onEditPermissions(member)}>
                    <Shield className="w-4 h-4" />
                  </Button>
                )}
                {onRemove && (
                  <Button size="sm" variant="destructive" onClick={() => onRemove(member.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function InviteForm({
  onSubmit,
  onCancel,
  loading,
}: {
  onSubmit: (data: { email: string; name: string; role: TeamRole; phone?: string }) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [form, setForm] = useState({
    email: "",
    name: "",
    role: "professional" as TeamRole,
    phone: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.name) return;
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Nome completo *</Label>
        <Input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Ex: João Silva"
          required
        />
      </div>
      <div>
        <Label>Email *</Label>
        <Input
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="joao@email.com"
          required
        />
      </div>
      <div>
        <Label>WhatsApp</Label>
        <Input
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          placeholder="(11) 99999-9999"
        />
      </div>
      <div>
        <Label>Cargo *</Label>
        <select
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value as TeamRole })}
        >
          <option value="manager">Gerente</option>
          <option value="professional">Profissional</option>
          <option value="receptionist">Recepcionista</option>
          <option value="cashier">Caixa</option>
        </select>
      </div>
      <div className="bg-muted/50 rounded-lg p-3 text-sm">
        <p className="font-medium mb-1">Permissões padrão para {ROLE_LABELS[form.role]}:</p>
        <ul className="text-muted-foreground text-xs space-y-1">
          {Object.entries(DEFAULT_PERMISSIONS[form.role])
            .filter(([, v]) => v)
            .slice(0, 5)
            .map(([k]) => (
              <li key={k}>• {k.replace(/_/g, " ").replace(/can /, "")}</li>
            ))}
          <li>• ...e mais</li>
        </ul>
      </div>
      <div className="flex gap-2 pt-2">
        <Button type="submit" className="flex-1" disabled={loading}>
          {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          Enviar Convite
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

function RoleEditor({
  member,
  onSave,
  onCancel,
  loading,
}: {
  member: TeamMember;
  onSave: (role: TeamRole) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [role, setRole] = useState<TeamRole>(member.role);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg">
          {ROLE_ICONS[member.role]}
        </div>
        <div>
          <p className="font-semibold">{member.name}</p>
          <p className="text-sm text-muted-foreground">{member.email}</p>
        </div>
      </div>

      <div>
        <Label>Novo cargo</Label>
        <select
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
          value={role}
          onChange={(e) => setRole(e.target.value as TeamRole)}
        >
          <option value="owner">Proprietário</option>
          <option value="manager">Gerente</option>
          <option value="professional">Profissional</option>
          <option value="receptionist">Recepcionista</option>
          <option value="cashier">Caixa</option>
        </select>
      </div>

      <div className="bg-muted/50 rounded-lg p-3 text-sm">
        <p className="font-medium mb-2">Permissões do cargo:</p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {Object.entries(DEFAULT_PERMISSIONS[role]).map(([k, v]) => (
            <div key={k} className={`flex items-center gap-1 ${v ? "text-green-600" : "text-gray-400"}`}>
              {v ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
              <span className="capitalize">{k.replace(/_/g, " ").replace(/can /, "")}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button onClick={() => onSave(role)} className="flex-1" disabled={loading}>
          {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          Salvar
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}

function PermissionsEditor({
  member,
  onSave,
  onCancel,
  loading,
}: {
  member: TeamMember;
  onSave: (perms: TeamPermissions) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [permissions, setPermissions] = useState<TeamPermissions>(member.permissions || DEFAULT_PERMISSIONS[member.role]);

  const togglePermission = (key: keyof TeamPermissions) => {
    setPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="font-semibold">{member.name}</p>
          <Badge variant="outline">{ROLE_LABELS[member.role]}</Badge>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setPermissions(DEFAULT_PERMISSIONS[member.role])}
        >
          Restaurar padrão
        </Button>
      </div>

      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
        {PERMISSION_GROUPS.map((group) => (
          <div key={group.key} className="border rounded-lg p-3">
            <div className="flex items-center gap-2 mb-3">
              <group.icon className="w-4 h-4 text-primary" />
              <h4 className="font-semibold text-sm">{group.label}</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {group.permissions.map((perm) => (
                <label key={perm.key} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 rounded p-1">
                  <input
                    type="checkbox"
                    checked={permissions[perm.key as keyof TeamPermissions]}
                    onChange={() => togglePermission(perm.key as keyof TeamPermissions)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">{perm.label}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 pt-2 border-t">
        <Button onClick={() => onSave(permissions)} className="flex-1" disabled={loading}>
          {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          Salvar Permissões
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
