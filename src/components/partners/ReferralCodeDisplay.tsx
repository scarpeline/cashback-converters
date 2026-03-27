import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Check, Share2 } from 'lucide-react';
import { toast } from 'sonner';

interface ReferralCodeDisplayProps {
  referralCode: string;
  partnerName: string;
}

export default function ReferralCodeDisplay({ referralCode, partnerName }: ReferralCodeDisplayProps) {
  const [copied, setCopied] = useState(false);

  const referralUrl = `${window.location.origin}/login?ref=${referralCode}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    toast.success('Código copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(referralUrl);
    toast.success('Link copiado!');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Junte-se a ${partnerName}`,
          text: `Cadastre-se usando meu código de indicação: ${referralCode}`,
          url: referralUrl,
        });
      } catch (error) {
        console.error('Erro ao compartilhar:', error);
      }
    } else {
      handleCopyUrl();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="w-5 h-5" />
          Seu Código de Indicação
        </CardTitle>
        <CardDescription>
          Compartilhe este código para ganhar comissões
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Código</label>
          <div className="flex gap-2">
            <Input
              value={referralCode}
              readOnly
              className="font-mono font-bold text-lg"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopyCode}
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Link de Indicação</label>
          <div className="flex gap-2">
            <Input
              value={referralUrl}
              readOnly
              className="text-xs"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopyUrl}
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <Button
          onClick={handleShare}
          className="w-full"
        >
          <Share2 className="w-4 h-4 mr-2" />
          Compartilhar
        </Button>

        <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800">
          💡 Cada pessoa que se cadastrar usando seu código gerará uma comissão para você.
        </div>
      </CardContent>
    </Card>
  );
}
