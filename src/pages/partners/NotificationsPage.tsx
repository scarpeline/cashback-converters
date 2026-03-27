import { useAuth } from '@/lib/auth';
import { usePartnerByUserId } from '@/hooks/usePartners';
import { Loader2 } from 'lucide-react';
import PartnerNotificationCenter from '@/components/partners/PartnerNotificationCenter';

export default function NotificationsPage() {
  const { user } = useAuth();
  const { data: partner, isLoading } = usePartnerByUserId(user?.id || '');

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Você não é um parceiro registrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PartnerNotificationCenter partnerId={partner.id} />
    </div>
  );
}
