import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { uploadImage } from "@/lib/upload-image";
import { toast } from "sonner";
import {
  Plus, Trash2, Edit, BookOpen, Video, FileText, Link2,
  ChevronDown, ChevronUp, Loader2, Image, DollarSign, Clock, Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface DigitalProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  digital_type: string | null;
  thumbnail_url: string | null;
  access_duration_days: number | null;
  product_type: string;
}

interface ContentModule {
  id: string;
  product_id: string;
  title: string;
  content_type: "video" | "pdf" | "audio" | "text" | "link";
  url: string | null;
  body: string | null;
  duration_minutes: number | null;
  sort_order: number;
  is_free_preview: boolean;
}

interface Props {
  barbershopId: string;
}

const DIGITAL_TYPES = [
  { value: "course", label: "Curso" },
  { value: "mentoring", label: "Mentoria" },
  { value: "ebook", label: "E-book" },
  { value: "template", label: "Template" },
  { value: "other", label: "Outro" },
];

const CONTENT_TYPES = [
  { value: "video", label: "Vídeo (YouTube/Vimeo)", icon: Video },
  { value: "pdf", label: "PDF", icon: FileText },
  { value: "text", label: "Texto", icon: BookOpen },
  { value: "link", label: "Link externo", icon: Link2 },
];

function calcFee(price: number) {
  const fixed = 2.5;
  const pct = price * 0.1;
  const total = fixed + pct;
  const net = price - total;
  return { fixed, pct, total, net };
}

export function DigitalProductsHub({ barbershopId }: Props) {
  const [products, setProducts] = useState<DigitalProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [modules, setModules] = useState<Record<string, ContentModule[]>>({});

  // Product form
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [digitalType, setDigitalType] = useState("course");
  const [accessDays, setAccessDays] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const thumbRef = useRef<HTMLInputElement>(null);

  // Module form
  const [showModuleForm, setShowModuleForm] = useState<string | null>(null);
  const [modTitle, setModTitle] = useState("");
  const [modType, setModType] = useState<"video" | "pdf" | "text" | "link">("video");
  const [modUrl, setModUrl] = useState("");
  const [modBody, setModBody] = useState("");
  const [modDuration, setModDuration] = useState("");
  const [modFreePreview, setModFreePreview] = useState(false);
  const [savingModule, setSavingModule] = useState(false);
  const pdfRef = useRef<HTMLInputElement>(null);

  const loadProducts = async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("store_products")
      .select("id,name,description,price,digital_type,thumbnail_url,access_duration_days,product_type")
      .eq("barbershop_id", barbershopId)
      .or("product_type.eq.course,digital_type.not.is.null")
      .order("created_at", { ascending: false });
    setProducts(data || []);
    setLoading(false);
  };

  const loadModules = async (productId: string) => {
    const { data } = await (supabase as any)
      .from("digital_product_content")
      .select("*")
      .eq("product_id", productId)
      .order("sort_order");
    setModules(prev => ({ ...prev, [productId]: data || [] }));
  };

  useEffect(() => { loadProducts(); }, [barbershopId]);

  const handleThumbUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("Imagem máximo 10MB"); return; }
    setUploadingThumb(true);
    const url = await uploadImage(file, "digital/thumbnails", barbershopId.slice(0, 8));
    if (url) setThumbnailUrl(url);
    else toast.error("Erro no upload");
    setUploadingThumb(false);
  };

  const resetProductForm = () => {
    setName(""); setDescription(""); setPrice(""); setDigitalType("course");
    setAccessDays(""); setThumbnailUrl(""); setShowForm(false);
  };

  const handleCreateProduct = async () => {
    if (!name.trim() || !price) { toast.error("Nome e preço são obrigatórios"); return; }
    setSavingProduct(true);
    const { error } = await (supabase as any).from("store_products").insert({
      barbershop_id: barbershopId,
      name,
      description: description || null,
      price: Number(price),
      product_type: "course",
      digital_type: digitalType,
      thumbnail_url: thumbnailUrl || null,
      access_duration_days: accessDays ? Number(accessDays) : null,
      is_active: true,
    });
    if (error) { toast.error("Erro ao criar produto"); setSavingProduct(false); return; }
    toast.success("Produto digital criado!");
    resetProductForm();
    await loadProducts();
    setSavingProduct(false);
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Remover produto digital?")) return;
    await (supabase as any).from("store_products").update({ is_active: false }).eq("id", id);
    toast.success("Produto removido");
    loadProducts();
  };

  const toggleExpand = async (id: string) => {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    if (!modules[id]) await loadModules(id);
  };

  const resetModuleForm = () => {
    setModTitle(""); setModType("video"); setModUrl(""); setModBody("");
    setModDuration(""); setModFreePreview(false); setShowModuleForm(null);
  };

  const handleCreateModule = async (productId: string) => {
    if (!modTitle.trim()) { toast.error("Título obrigatório"); return; }
    setSavingModule(true);
    const existing = modules[productId] || [];
    const { error } = await (supabase as any).from("digital_product_content").insert({
      product_id: productId,
      title: modTitle,
      content_type: modType,
      url: modUrl || null,
      body: modBody || null,
      duration_minutes: modDuration ? Number(modDuration) : null,
      sort_order: existing.length,
      is_free_preview: modFreePreview,
    });
    if (error) { toast.error("Erro ao criar módulo"); setSavingModule(false); return; }
    toast.success("Módulo adicionado!");
    resetModuleForm();
    await loadModules(productId);
    setSavingModule(false);
  };

  const handleDeleteModule = async (moduleId: string, productId: string) => {
    await (supabase as any).from("digital_product_content").delete().eq("id", moduleId);
    toast.success("Módulo removido");
    loadModules(productId);
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadImage(file, "digital/pdfs", barbershopId.slice(0, 8));
    if (url) setModUrl(url);
    else toast.error("Erro no upload do PDF");
  };

  const priceNum = Number(price) || 0;
  const fee = calcFee(priceNum);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white">
            Loja <span className="text-gradient-gold">Digital</span>
          </h2>
          <p className="text-slate-400 text-sm font-medium mt-1">Cursos, mentorias, e-books e templates</p>
        </div>
        <Button variant="gold" className="rounded-2xl font-black shadow-gold h-11 px-6 diamond-glow"
          onClick={() => { resetProductForm(); setShowForm(!showForm); }}>
          <Plus className="w-4 h-4 mr-2" /> {showForm ? "Fechar" : "Novo Produto"}
        </Button>
      </div>

      {/* Product creation form */}
      {showForm && (
        <div className="glass-card rounded-[2.5rem] p-8 border border-orange-500/20 animate-in slide-in-from-top-4 duration-400">
          <h3 className="text-lg font-black text-white mb-6">Criar Produto Digital</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Thumbnail */}
            <div className="md:col-span-2 flex items-center gap-6">
              <button
                onClick={() => thumbRef.current?.click()}
                className="w-24 h-24 rounded-[1.5rem] bg-slate-900 border-2 border-dashed border-white/10 flex items-center justify-center hover:border-orange-500/40 transition-all overflow-hidden flex-shrink-0"
              >
                {uploadingThumb ? (
                  <Loader2 className="w-6 h-6 text-orange-400 animate-spin" />
                ) : thumbnailUrl ? (
                  <img src={thumbnailUrl} className="w-full h-full object-cover" alt="thumb" />
                ) : (
                  <Image className="w-6 h-6 text-slate-600" />
                )}
              </button>
              <input ref={thumbRef} type="file" hidden accept="image/*" onChange={handleThumbUpload} />
              <div>
                <p className="text-sm font-bold text-white">Thumbnail</p>
                <p className="text-xs text-slate-500 mt-1">Clique para fazer upload (máx 10MB)</p>
              </div>
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label className="text-slate-400 font-bold">Nome do Produto</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Curso de Corte Masculino"
                className="bg-white/5 border-white/10 rounded-2xl h-12 text-white" />
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label className="text-slate-400 font-bold">Descrição</Label>
              <textarea value={description} onChange={e => setDescription(e.target.value)}
                placeholder="Descreva o produto..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-3 text-white text-sm resize-none h-20 focus:outline-none focus:border-orange-500/50" />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-400 font-bold">Tipo</Label>
              <select value={digitalType} onChange={e => setDigitalType(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl h-12 px-4 text-white text-sm focus:outline-none focus:border-orange-500/50">
                {DIGITAL_TYPES.map(t => <option key={t.value} value={t.value} className="bg-slate-900">{t.label}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-400 font-bold">Acesso (dias, opcional)</Label>
              <Input type="number" value={accessDays} onChange={e => setAccessDays(e.target.value)}
                placeholder="Ex: 365 (vitalício se vazio)"
                className="bg-white/5 border-white/10 rounded-2xl h-12 text-white" />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-400 font-bold">Preço (R$)</Label>
              <Input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="0,00"
                className="bg-white/5 border-white/10 rounded-2xl h-12 text-white" />
            </div>

            {/* Fee preview */}
            {priceNum > 0 && (
              <div className="flex items-center gap-3 bg-orange-500/10 border border-orange-500/20 rounded-2xl px-4 py-3">
                <DollarSign className="w-4 h-4 text-orange-400 flex-shrink-0" />
                <div className="text-xs text-slate-300">
                  <span className="font-bold text-orange-400">Taxa plataforma:</span>{" "}
                  R$ 2,50 + 10% = <span className="font-black text-white">R$ {fee.total.toFixed(2)}</span>
                  {" · "}Você recebe: <span className="font-black text-emerald-400">R$ {fee.net.toFixed(2)}</span>
                </div>
              </div>
            )}

            <div className="md:col-span-2 flex justify-end gap-3 pt-2">
              <Button variant="ghost" className="rounded-2xl h-11 font-bold" onClick={resetProductForm}>Cancelar</Button>
              <Button variant="gold" className="rounded-2xl h-11 px-8 font-black shadow-gold"
                onClick={handleCreateProduct} disabled={savingProduct}>
                {savingProduct ? <Loader2 className="w-4 h-4 animate-spin" /> : "Criar Produto"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Products list */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(i => <div key={i} className="h-28 bg-white/5 rounded-[2.5rem] animate-pulse" />)}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-white/10 rounded-[2.5rem]">
          <BookOpen className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500 font-bold">Nenhum produto digital ainda</p>
          <p className="text-slate-600 text-sm mt-1">Crie cursos, mentorias e e-books para vender</p>
        </div>
      ) : (
        <div className="space-y-4">
          {products.map(product => {
            const isExpanded = expandedId === product.id;
            const productModules = modules[product.id] || [];
            const fee = calcFee(product.price);
            const typeLabel = DIGITAL_TYPES.find(t => t.value === product.digital_type)?.label || "Digital";

            return (
              <div key={product.id} className="glass-card rounded-[2.5rem] border border-white/5 overflow-hidden">
                <div className="p-6 flex items-center gap-4">
                  {product.thumbnail_url ? (
                    <img src={product.thumbnail_url} className="w-16 h-16 rounded-2xl object-cover flex-shrink-0" alt="" />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-7 h-7 text-slate-600" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-black text-white truncate">{product.name}</h3>
                      <Badge variant="outline" className="rounded-full bg-orange-500/10 text-orange-400 border-orange-500/20 text-[10px] font-black uppercase tracking-widest flex-shrink-0">
                        {typeLabel}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="font-black text-gradient-gold text-base">R$ {Number(product.price).toFixed(2)}</span>
                      <span>→ você recebe <span className="text-emerald-400 font-bold">R$ {fee.net.toFixed(2)}</span></span>
                      {product.access_duration_days && (
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{product.access_duration_days}d</span>
                      )}
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{productModules.length} módulos</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9 hover:bg-red-500/10"
                      onClick={() => handleDeleteProduct(product.id)}>
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </Button>
                    <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9 hover:bg-white/5"
                      onClick={() => toggleExpand(product.id)}>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </Button>
                  </div>
                </div>

                {/* Modules section */}
                {isExpanded && (
                  <div className="border-t border-white/5 p-6 space-y-4 animate-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Módulos / Aulas</p>
                      <Button variant="ghost" size="sm" className="rounded-xl text-orange-400 hover:bg-orange-500/10 font-bold gap-1 h-8"
                        onClick={() => setShowModuleForm(showModuleForm === product.id ? null : product.id)}>
                        <Plus className="w-3.5 h-3.5" /> Adicionar
                      </Button>
                    </div>

                    {/* Module form */}
                    {showModuleForm === product.id && (
                      <div className="bg-white/5 rounded-2xl p-5 space-y-4 border border-white/10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="md:col-span-2 space-y-1.5">
                            <Label className="text-slate-400 text-xs font-bold">Título do Módulo</Label>
                            <Input value={modTitle} onChange={e => setModTitle(e.target.value)}
                              placeholder="Ex: Aula 1 - Introdução"
                              className="bg-white/5 border-white/10 rounded-xl h-10 text-white text-sm" />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-slate-400 text-xs font-bold">Tipo de Conteúdo</Label>
                            <select value={modType} onChange={e => setModType(e.target.value as any)}
                              className="w-full bg-white/5 border border-white/10 rounded-xl h-10 px-3 text-white text-sm focus:outline-none">
                              {CONTENT_TYPES.map(t => <option key={t.value} value={t.value} className="bg-slate-900">{t.label}</option>)}
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-slate-400 text-xs font-bold">Duração (min, opcional)</Label>
                            <Input type="number" value={modDuration} onChange={e => setModDuration(e.target.value)}
                              placeholder="Ex: 15"
                              className="bg-white/5 border-white/10 rounded-xl h-10 text-white text-sm" />
                          </div>

                          {(modType === "video" || modType === "link") && (
                            <div className="md:col-span-2 space-y-1.5">
                              <Label className="text-slate-400 text-xs font-bold">URL</Label>
                              <Input value={modUrl} onChange={e => setModUrl(e.target.value)}
                                placeholder={modType === "video" ? "https://youtube.com/watch?v=..." : "https://..."}
                                className="bg-white/5 border-white/10 rounded-xl h-10 text-white text-sm" />
                            </div>
                          )}

                          {modType === "pdf" && (
                            <div className="md:col-span-2 space-y-1.5">
                              <Label className="text-slate-400 text-xs font-bold">Arquivo PDF</Label>
                              <div className="flex gap-2">
                                <Input value={modUrl} onChange={e => setModUrl(e.target.value)}
                                  placeholder="URL do PDF ou faça upload"
                                  className="bg-white/5 border-white/10 rounded-xl h-10 text-white text-sm flex-1" />
                                <Button variant="ghost" size="sm" className="rounded-xl h-10 px-4 text-orange-400 hover:bg-orange-500/10 font-bold"
                                  onClick={() => pdfRef.current?.click()}>
                                  Upload
                                </Button>
                                <input ref={pdfRef} type="file" hidden accept=".pdf" onChange={handlePdfUpload} />
                              </div>
                            </div>
                          )}

                          {modType === "text" && (
                            <div className="md:col-span-2 space-y-1.5">
                              <Label className="text-slate-400 text-xs font-bold">Conteúdo</Label>
                              <textarea value={modBody} onChange={e => setModBody(e.target.value)}
                                placeholder="Escreva o conteúdo da aula..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm resize-none h-24 focus:outline-none" />
                            </div>
                          )}

                          <div className="md:col-span-2 flex items-center gap-3">
                            <input type="checkbox" id={`preview-${product.id}`} checked={modFreePreview}
                              onChange={e => setModFreePreview(e.target.checked)}
                              className="w-4 h-4 rounded accent-orange-500" />
                            <label htmlFor={`preview-${product.id}`} className="text-sm text-slate-400 font-bold cursor-pointer">
                              Preview gratuito (visível sem compra)
                            </label>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" className="rounded-xl font-bold" onClick={resetModuleForm}>Cancelar</Button>
                          <Button variant="gold" size="sm" className="rounded-xl font-black px-6"
                            onClick={() => handleCreateModule(product.id)} disabled={savingModule}>
                            {savingModule ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Salvar Módulo"}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Modules list */}
                    {productModules.length === 0 ? (
                      <p className="text-xs text-slate-600 text-center py-4">Nenhum módulo ainda. Adicione aulas ao produto.</p>
                    ) : (
                      <div className="space-y-2">
                        {productModules.map((mod, idx) => {
                          const typeInfo = CONTENT_TYPES.find(t => t.value === mod.content_type);
                          const Icon = typeInfo?.icon || BookOpen;
                          return (
                            <div key={mod.id} className="flex items-center gap-3 bg-white/5 rounded-2xl px-4 py-3 group">
                              <span className="text-xs font-black text-slate-600 w-5">{idx + 1}</span>
                              <div className="w-7 h-7 rounded-xl bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                                <Icon className="w-3.5 h-3.5 text-orange-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-white truncate">{mod.title}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[10px] text-slate-600 uppercase tracking-widest">{typeInfo?.label}</span>
                                  {mod.duration_minutes && <span className="text-[10px] text-slate-600">{mod.duration_minutes}min</span>}
                                  {mod.is_free_preview && (
                                    <Badge variant="outline" className="rounded-full bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[9px] font-black uppercase tracking-widest px-2 py-0">
                                      Preview
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <Button variant="ghost" size="icon" className="rounded-xl h-7 w-7 opacity-0 group-hover:opacity-100 hover:bg-red-500/10 transition-all"
                                onClick={() => handleDeleteModule(mod.id, product.id)}>
                                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
