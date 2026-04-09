# Imagens Skill

## Estratégia de Imagens

O projeto usa imagens em contextos específicos. Preferir ícones SVG (Lucide) e elementos CSS sempre que possível.

## Upload de Imagens

### Serviço de upload
```tsx
import { uploadImage } from "@/lib/upload-image"

// Uso
const url = await uploadImage(file, "avatars", userId)
// Retorna: string (URL pública) | null (erro)
```

### Buckets do Supabase Storage
- `avatars` — fotos de perfil de profissionais e usuários
- `barbershops` — logos e fotos do estabelecimento
- `accounting-docs` — documentos contábeis (privado)

### Componente de upload de foto
```tsx
import { ProfilePhotoUpload } from "@/components/shared/ProfilePhotoUpload"

<ProfilePhotoUpload
  currentUrl={profile?.avatar_url}
  onUpload={(url) => setAvatarUrl(url)}
  bucket="avatars"
  folder={userId}
/>
```

## Avatar / Foto de Perfil

```tsx
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// Padrão
<Avatar className="w-10 h-10">
  <AvatarImage src={profile?.avatar_url || ""} alt={profile?.name} />
  <AvatarFallback className="bg-orange-100 text-orange-600 text-sm font-semibold">
    {profile?.name?.charAt(0)?.toUpperCase() || "U"}
  </AvatarFallback>
</Avatar>

// Tamanhos
// Pequeno (lista): w-8 h-8
// Médio (card): w-10 h-10
// Grande (perfil): w-16 h-16
// Extra (onboarding): w-24 h-24
```

## Logo do Sistema

```tsx
import logo from "@/assets/logo.png"

<img src={logo} alt="SalãoCashBack" className="w-8 h-8 object-contain" />
```

## Imagens Externas

- Usar `loading="lazy"` sempre
- Definir `width` e `height` para evitar layout shift
- Usar `object-cover` para imagens de proporção variável

```tsx
<img
  src={imageUrl}
  alt="Descrição"
  className="w-full h-48 object-cover rounded-xl"
  loading="lazy"
/>
```

## Placeholder / Fallback

```tsx
// Quando não há imagem
<div className="w-full h-48 bg-slate-100 rounded-xl flex items-center justify-center">
  <ImageIcon className="w-8 h-8 text-slate-300" />
</div>
```

## Otimização

- Máximo 2MB por upload (validar no cliente)
- Formatos aceitos: JPG, PNG, WebP
- Redimensionar no cliente antes do upload quando possível
- Usar URLs do Supabase Storage (CDN automático)

## Validação de arquivo

```tsx
const MAX_SIZE = 2 * 1024 * 1024 // 2MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp"]

const validateImage = (file: File): string | null => {
  if (!ALLOWED.includes(file.type)) return "Formato inválido. Use JPG, PNG ou WebP"
  if (file.size > MAX_SIZE) return "Arquivo muito grande. Máximo 2MB"
  return null
}
```

## Vitrine Pública

Para a vitrine do estabelecimento (`/v/:barbershopId`):
- Logo: quadrado, mínimo 200x200px
- Capa: 16:9, mínimo 800x450px
- Fotos de serviços: quadrado, mínimo 400x400px
