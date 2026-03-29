import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Download, Loader2, Upload } from "lucide-react";

const db = supabase as any;

type Mode = "owner" | "accountant";

type AccountingDocument = {
  id: string;
  title: string;
  doc_type: string;
  status: string;
  created_at: string;
  is_company_document: boolean;
  barbershop_id: string | null;
};

export function AccountingDocumentsPanel({
  mode,
  barbershopId,
}: {
  mode: Mode;
  barbershopId?: string | null;
}) {
  const [loading, setLoading] = useState(true);
  const [docs, setDocs] = useState<AccountingDocument[]>([]);
  const [uploading, setUploading] = useState(false);

  const [title, setTitle] = useState("");
  const [isCompany, setIsCompany] = useState(true);
  const [file, setFile] = useState<File | null>(null);

  const canUpload = mode === "owner";

  const uploadContext = useMemo(() => {
    const isCompanyDocument = !!(isCompany && barbershopId);
    return {
      isCompanyDocument,
      barbershopId: isCompanyDocument ? barbershopId! : null,
    };
  }, [isCompany, barbershopId]);

  const fetchDocs = async () => {
    setLoading(true);
    const { data, error } = await db
      .from("accounting_documents")
      .select("id,title,doc_type,status,created_at,is_company_document,barbershop_id")
      .order("created_at", { ascending: false });

    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    setDocs((data || []) as AccountingDocument[]);
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const downloadDoc = async (docId: string) => {
    const { data, error } = await supabase.functions.invoke("accounting-docs", {
      body: { action: "download", document_id: docId },
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    const signedUrl = (data as any)?.signed_url as string | undefined;
    if (!signedUrl) {
      toast.error("Falha ao gerar link de download.");
      return;
    }

    window.open(signedUrl, "_blank", "noopener,noreferrer");
  };

  const handleInitUpload = async () => {
    if (!canUpload) return;
    if (!title.trim()) return toast.error("Informe um título.");
    if (!file) return toast.error("Selecione um arquivo.");

    if (isCompany && !barbershopId) {
      return toast.error("Nenhuma barbearia encontrada para enviar documento da empresa.");
    }

    setUploading(true);

    const { data, error } = await supabase.functions.invoke("accounting-docs", {
      body: {
        action: "init_upload",
        title: title.trim(),
        doc_type: "other",
        is_company_document: uploadContext.isCompanyDocument,
        barbershop_id: uploadContext.barbershopId,
        filename: file.name,
        mime_type: file.type || null,
        file_size_bytes: file.size || null,
      },
    });

    if (error) {
      setUploading(false);
      toast.error(error.message);
      return;
    }

    const path = (data as any)?.path as string | undefined;
    const token = (data as any)?.token as string | undefined;
    if (!path || !token) {
      setUploading(false);
      toast.error("Falha ao iniciar upload.");
      return;
    }

    const { error: uploadErr } = await (supabase.storage as any)
      .from("accounting-docs")
      .uploadToSignedUrl(path, token, file);

    setUploading(false);

    if (uploadErr) {
      toast.error(uploadErr.message || "Erro ao enviar arquivo.");
      return;
    }

    toast.success("Documento enviado!");
    setTitle("");
    setFile(null);
    await fetchDocs();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Documentos Contábeis</h1>
        <p className="text-muted-foreground text-sm">
          Faça upload e acompanhe os documentos fiscais. O acesso é controlado por vínculo e permissões.
        </p>
      </div>

      {canUpload && (
        <Card>
          <CardHeader>
            <CardTitle>Enviar documento</CardTitle>
            <CardDescription>O documento ficará disponível para você e para o contador (quando houver vínculo ativo).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Extrato bancário Março" />
            </div>

            <div className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border">
              <div className="min-w-0">
                <p className="text-sm font-medium">Documento da empresa</p>
                <p className="text-xs text-muted-foreground">Se desmarcar, o documento será tratado como pessoal.</p>
              </div>
              <input
                type="checkbox"
                className="h-5 w-5"
                checked={isCompany}
                onChange={(e) => setIsCompany(e.target.checked)}
              />
            </div>

            <div className="space-y-2">
              <Label>Arquivo</Label>
              <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </div>

            <Button variant="gold" onClick={handleInitUpload} disabled={uploading} className="gap-2">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Enviar
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Meus documentos</CardTitle>
          <CardDescription>Lista de documentos disponíveis para sua conta.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3" />
              Carregando...
            </div>
          ) : docs.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">Nenhum documento encontrado.</div>
          ) : (
            <div className="space-y-3">
              {docs.map((d) => (
                <div key={d.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-lg border border-border">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{d.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {d.is_company_document ? "Empresa" : "Pessoal"} • {d.status} • {new Date(d.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => downloadDoc(d.id)}>
                      <Download className="w-4 h-4" />
                      Baixar
                    </Button>
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
