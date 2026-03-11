import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type Mode = "owner" | "accountant";

type LinkRow = {
  id: string;
  barbershop_id: string;
  accountant_id: string;
  status: "pending" | "active" | "revoked";
  requested_at: string;
  accepted_at: string | null;
  revoked_at: string | null;
};

export function AccountingLinksPanel({
  mode,
  barbershopId,
}: {
  mode: Mode;
  barbershopId?: string | null;
}) {
  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState<LinkRow[]>([]);

  const [creating, setCreating] = useState(false);
  const [accountantEmail, setAccountantEmail] = useState("");

  const canCreate = mode === "owner";

  const title = useMemo(() => {
    return mode === "owner" ? "Vínculo com Contador" : "Empresas Vinculadas";
  }, [mode]);

  const description = useMemo(() => {
    return mode === "owner"
      ? "Solicite e gerencie o vínculo com um contador. O contador só acessa documentos da empresa após o vínculo ficar ativo."
      : "Gerencie solicitações de vínculo de empresas (aceite para ativar acesso aos documentos).";
  }, [mode]);

  const fetchLinks = async () => {
    setLoading(true);

    let query = (supabase as any)
      .from("accountant_barbershop_links")
      .select("id, barbershop_id, accountant_id, status, requested_at, accepted_at, revoked_at")
      .order("requested_at", { ascending: false });

    if (mode === "owner") {
      if (barbershopId) {
        query = query.eq("barbershop_id", barbershopId);
      }
    }

    const { data, error } = await query;

    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    setLinks((data || []) as unknown as LinkRow[]);
  };

  useEffect(() => {
    fetchLinks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, barbershopId]);

  const createLink = async () => {
    if (!canCreate) return;
    if (!barbershopId) return toast.error("Nenhuma barbearia encontrada.");
    if (!accountantEmail.trim()) return toast.error("Informe o e-mail do contador.");

    setCreating(true);

    const { data: authData, error: authErr } = await supabase.auth.getUser();
    const currentUserId = authData?.user?.id || null;
    if (authErr || !currentUserId) {
      setCreating(false);
      toast.error("Sessão inválida. Faça login novamente.");
      return;
    }

    const { data: accountantId, error: accErr } = await (supabase as any).rpc("get_accountant_id_by_email", {
      _email: accountantEmail.trim(),
    });

    if (accErr) {
      setCreating(false);
      toast.error(accErr.message);
      return;
    }

    if (!accountantId) {
      setCreating(false);
      toast.error("Contador não encontrado ou inativo.");
      return;
    }

    const { error: insErr } = await (supabase as any).from("accountant_barbershop_links").insert({
      barbershop_id: barbershopId,
      accountant_id: accountantId,
      status: "pending",
      requested_by_user_id: currentUserId,
      requested_at: new Date().toISOString(),
    } as any);

    setCreating(false);

    if (insErr) {
      toast.error(insErr.message);
      return;
    }

    toast.success("Solicitação enviada ao contador!");
    setAccountantEmail("");
    await fetchLinks();
  };

  const acceptLink = async (linkId: string) => {
    const { error } = await supabase
      .from("accountant_barbershop_links")
      .update({ status: "active", accepted_at: new Date().toISOString() })
      .eq("id", linkId)
      .eq("status", "pending");

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Vínculo ativado!");
    await fetchLinks();
  };

  const revokeLink = async (linkId: string) => {
    const { error } = await supabase
      .from("accountant_barbershop_links")
      .update({ status: "revoked", revoked_at: new Date().toISOString() })
      .eq("id", linkId);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Vínculo revogado.");
    await fetchLinks();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">{title}</h1>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>

      {canCreate && (
        <Card>
          <CardHeader>
            <CardTitle>Solicitar vínculo</CardTitle>
            <CardDescription>Informe o e-mail do contador para enviar a solicitação.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>E-mail do contador</Label>
              <Input value={accountantEmail} onChange={(e) => setAccountantEmail(e.target.value)} placeholder="contador@exemplo.com" />
            </div>
            <Button variant="gold" onClick={createLink} disabled={creating}>
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enviar solicitação"}
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Vínculos</CardTitle>
          <CardDescription>Status dos vínculos.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3" />
              Carregando...
            </div>
          ) : links.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">Nenhum vínculo encontrado.</div>
          ) : (
            <div className="space-y-3">
              {links.map((l) => (
                <div key={l.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-lg border border-border">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{l.status === "active" ? "Ativo" : l.status === "pending" ? "Pendente" : "Revogado"}</p>
                    <p className="text-xs text-muted-foreground">
                      Solicitação: {new Date(l.requested_at).toLocaleString()}
                      {l.accepted_at ? ` • Aceito: ${new Date(l.accepted_at).toLocaleString()}` : ""}
                      {l.revoked_at ? ` • Revogado: ${new Date(l.revoked_at).toLocaleString()}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {mode === "accountant" && l.status === "pending" && (
                      <Button size="sm" variant="gold" onClick={() => acceptLink(l.id)}>Aceitar</Button>
                    )}
                    {l.status !== "revoked" && (
                      <Button size="sm" variant="outline" onClick={() => revokeLink(l.id)}>Revogar</Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
