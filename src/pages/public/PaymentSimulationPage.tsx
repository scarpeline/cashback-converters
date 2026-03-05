import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, ShieldCheck, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

const PaymentSimulationPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<any>(null);

    useEffect(() => {
        const plan = localStorage.getItem("selected_plan");
        if (plan) {
            setSelectedPlan(JSON.parse(plan));
        }
    }, []);

    const handleSimulatePayment = () => {
        setLoading(true);
        // Simular processamento (ASAAS)
        setTimeout(() => {
            setLoading(false);
            setSuccess(true);
            toast.success("Pagamento aprovado com sucesso! (SIMULAÇÃO)");

            // Armazenar flag de pagamento para o onboarding/auth
            localStorage.setItem("simulation_paid", "true");

            // Redirecionar após 3 segundos
            setTimeout(() => {
                navigate("/login");
            }, 3000);
        }, 2000);
    };

    if (success) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <Card className="max-w-md w-full text-center py-8">
                    <CardContent className="space-y-4">
                        <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="w-10 h-10 text-success" />
                        </div>
                        <CardTitle className="text-2xl font-bold">Pagamento Confirmado!</CardTitle>
                        <CardDescription className="text-lg">
                            Sua assinatura do plano <strong>{selectedPlan?.name || "Premium"}</strong> foi ativada com sucesso.
                        </CardDescription>
                        <div className="pt-8">
                            <p className="text-muted-foreground text-sm flex items-center justify-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Redirecionando para o login...
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-gold" />

            <Link to="/" className="mb-8 flex items-center gap-2">
                <img src={logo} alt="Logo" className="w-10 h-10" />
                <span className="font-display font-bold text-xl text-gradient-gold">SalãoCashBack</span>
            </Link>

            <Card className="max-w-lg w-full shadow-2xl border-primary/20 bg-gradient-card">
                <CardHeader className="border-b border-border/50 pb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Checkout Seguro</CardTitle>
                            <CardDescription>Ambiente de Simulação de Pagamento (Ambiente de Teste)</CardDescription>
                        </div>
                        <ShieldCheck className="text-primary w-8 h-8" />
                    </div>
                </CardHeader>

                <CardContent className="pt-6 space-y-6">
                    {/* Plan Summary */}
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 mb-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm text-muted-foreground">Plano Selecionado</p>
                                <p className="text-lg font-bold">{selectedPlan?.name || "Mensal"}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-muted-foreground">Valor</p>
                                <p className="text-lg font-bold text-gradient-gold">R$ {selectedPlan?.price || "19,90"}</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="card-name">Nome no Cartão</Label>
                            <Input id="card-name" placeholder="TESTE USER" defaultValue="TESTE USER" />
                        </div>

                        <div className="grid gap-2 text-center text-xs text-muted-foreground bg-muted p-3 rounded-lg border border-dashed border-border">
                            ESTA É UMA TELA DE TESTE. NÃO INSIRA DADOS REAIS DE CARTÃO.
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="card-number">Número do Cartão</Label>
                            <div className="relative">
                                <Input id="card-number" placeholder="4444 4444 4444 4444" defaultValue="4444 4444 4444 4444" />
                                <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="expiry">Validade</Label>
                                <Input id="expiry" placeholder="12/29" defaultValue="12/29" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="cvv">CVV</Label>
                                <Input id="cvv" placeholder="123" defaultValue="123" />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                        <ShieldCheck className="w-4 h-4 text-success" />
                        Processado via <span className="font-bold">ASAAS Gateway</span> em modo Sandbox
                    </div>
                </CardContent>

                <CardFooter className="flex flex-col gap-3 pt-6 border-t border-border/50">
                    <Button
                        variant="gold"
                        className="w-full h-12 text-lg font-bold shadow-gold"
                        onClick={handleSimulatePayment}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Processando...
                            </>
                        ) : (
                            "Confirmar Pagamento Simulado"
                        )}
                    </Button>
                    <Button
                        variant="ghost"
                        className="w-full text-muted-foreground"
                        onClick={() => navigate("/")}
                        disabled={loading}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Voltar para a Home
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
};

export default PaymentSimulationPage;
