import { usePartnerHierarchy } from '@/hooks/usePartners';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ChevronRight } from 'lucide-react';

interface PartnerHierarchyTreeProps {
  partnerId: string;
}

export default function PartnerHierarchyTree({ partnerId }: PartnerHierarchyTreeProps) {
  const { data: hierarchy, isLoading } = usePartnerHierarchy(partnerId);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hierarchy || hierarchy.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Nenhuma hierarquia encontrada</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hierarquia de Parceiros</CardTitle>
        <CardDescription>
          Sua posição na rede de parceiros
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {hierarchy.map((partner, index) => (
            <div key={partner.id} className="flex items-center gap-2">
              {index > 0 && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <ChevronRight className="w-4 h-4" />
                </div>
              )}
              <div className={`px-3 py-2 rounded-lg ${
                index === 0 
                  ? 'bg-primary/10 border border-primary' 
                  : 'bg-muted'
              }`}>
                <p className="font-medium text-sm">
                  {partner.type.charAt(0).toUpperCase() + partner.type.slice(1)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Nível {partner.level}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
